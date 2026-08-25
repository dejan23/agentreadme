import type { Category, Check, RepoSnapshot } from "./types";
import { tally } from "./tally";
import { CI_FILES, LINTER_FILES, TYPECHECK_FILES, blobs, ciWorkflows, compilerTypeChecks, existsAnywhere, file, has, hasAny, isSource, matching, pkg, pyproject, testFiles } from "./detect";

export function gradeVerification(s: RepoSnapshot): Category {
  const checks: Check[] = [];

  // --- Do tests exist, and are they proportionate? ---
  const tests = testFiles(s);
  const sources = blobs(s).filter((e) => isSource(e.path));
  const ratio = sources.length > 0 ? tests.length / sources.length : 0;
  let testScore = 0;
  if (tests.length > 0) testScore += 4;
  if (ratio >= 0.05) testScore += 2;
  if (ratio >= 0.15) testScore += 2;

  checks.push({
    id: "tests-exist",
    label: "Tests exist",
    score: testScore,
    max: 8,
    severity: tests.length === 0 ? "critical" : testScore >= 6 ? undefined : "minor",
    verdict:
      tests.length === 0
        ? "No test files found. An agent has no way to know whether its change broke anything."
        : `${tests.length} test ${tests.length === 1 ? "file" : "files"} against ${sources.length} source files.`,
    fix:
      tests.length === 0
        ? "This is the single highest-leverage change on this page. Agents don't need full coverage, they need one command that goes red when they break something. Even a handful of tests on the core path converts blind editing into a feedback loop."
        : testScore >= 6
          ? undefined
          : "Coverage is thin enough that an agent can break real behavior and still see green.",
    evidence: tests.length ? [`e.g. ${tests.slice(0, 3).map((t) => t.path).join(", ")}`] : undefined,
  });

  // --- Can the agent FIND the test command? ---
  const p = pkg(s);
  const scriptKeys: string[] = p?.scripts ? Object.keys(p.scripts) : [];
  const npmTest = scriptKeys.find((k) => /^(test|test:unit|check|ci)$/i.test(k));
  const mk = file(s, "Makefile") ?? file(s, "makefile");
  const makeTest = mk ? /^\.?(test|check)\s*:/m.test(mk) : false;
  const jf = file(s, "justfile") ?? file(s, "Justfile");
  const justTest = jf ? /^(test|check)\s*:/m.test(jf) : false;
  const pyproj = pyproject(s);
  const setupCfg = file(s, "setup.cfg");
  const pyTest =
    has(s, "pytest.ini") ||
    has(s, "tox.ini") ||
    has(s, "noxfile.py") ||
    existsAnywhere(s, /(^|\/)conftest\.py$/) ||
    (pyproj ? /\[tool\.(pytest|tox)/.test(pyproj) : false) ||
    (setupCfg ? /\[tool:pytest\]/.test(setupCfg) : false);
  const goTest = has(s, "go.mod") && tests.length > 0;
  const cargoTest = has(s, "Cargo.toml") && tests.length > 0;
  const discoverable = npmTest || makeTest || justTest || pyTest || goTest || cargoTest;

  const how = npmTest
    ? `npm run ${npmTest}`
    : makeTest
      ? "make test"
      : justTest
        ? "just test"
        : pyTest
          ? "pytest"
          : goTest
            ? "go test ./..."
            : cargoTest
              ? "cargo test"
              : null;

  checks.push({
    id: "test-command",
    label: "Test command is discoverable",
    score: discoverable ? 7 : 0,
    max: 7,
    severity: discoverable ? undefined : "critical",
    verdict: discoverable
      ? `An agent can find and run \`${how}\`.`
      : "There's no obvious way to run the tests. Even if tests exist, an agent won't reliably find the entry point.",
    fix: discoverable
      ? undefined
      : "Add a `test` script or a `test` target that runs the whole suite with no arguments. The convention is the interface — an agent tries `npm test` and `make test` before it tries reading your CI config.",
  });

  // --- CI ---
  const gha = ciWorkflows(s);
  const otherCi = hasAny(s, CI_FILES);
  const ci = gha.length > 0 || !!otherCi;
  checks.push({
    id: "ci",
    label: "Continuous integration",
    score: ci ? 4 : 0,
    max: 4,
    severity: ci ? undefined : "minor",
    verdict: ci
      ? gha.length
        ? `${gha.length} GitHub Actions ${gha.length === 1 ? "workflow" : "workflows"} define what "passing" means.`
        : `${otherCi} defines what "passing" means.`
      : "No CI config. Nothing outside a developer's laptop enforces correctness.",
    fix: ci
      ? undefined
      : "A CI workflow doubles as machine-readable documentation: it's the one file that states, unambiguously, the exact commands that must succeed.",
  });

  // --- Lint / format ---
  const lint = hasAny(s, LINTER_FILES);
  const lintInPyproject = pyproj ? /\[tool\.(ruff|black|flake8|isort|pylint)/.test(pyproj) : false;
  const lintInSetupCfg = setupCfg ? /\[(flake8|isort)\]/.test(setupCfg) : false;
  const lintScore = lint || lintInPyproject || lintInSetupCfg ? 3 : 0;
  checks.push({
    id: "lint",
    label: "Lint and format rules",
    score: lintScore,
    max: 3,
    severity: lintScore ? undefined : "minor",
    verdict: lintScore
      ? `${lint ?? "pyproject.toml"} encodes the house style.`
      : "No linter or formatter config. Style is tribal knowledge, so agent output will drift from yours.",
    fix: lintScore
      ? undefined
      : "A formatter config is the cheapest way to stop reviewing whitespace in agent diffs. It moves style from opinion to a command.",
  });

  // --- Types ---
  // A compiled, statically typed language type checks on every build. Asking it
  // for a tsconfig is the rubric being wrong, not the repository.
  const compiled = compilerTypeChecks(s);
  if (compiled) {
    checks.push({
      id: "types",
      label: "Static type checking",
      score: 0,
      max: 3,
      na: true,
      verdict: `Not applicable — the ${compiled} compiler type checks every build.`,
    });
  } else {
    const tsconfigRaw = file(s, "tsconfig.json");
    const strict = tsconfigRaw ? /"strict"\s*:\s*true/.test(tsconfigRaw) : false;
    const typeCfg = hasAny(s, TYPECHECK_FILES);
    const mypyInPyproject = pyproj ? /\[tool\.(mypy|pyright)/.test(pyproj) : false;
    const typed = has(s, "py.typed") || matching(s, /(^|\/)py\.typed$/).length > 0;
    let typeScore = 0;
    if (typeCfg || mypyInPyproject || typed) typeScore += 2;
    if (strict) typeScore += 1;
    checks.push({
      id: "types",
      label: "Static type checking",
      score: typeScore,
      max: 3,
      severity: typeScore >= 2 ? undefined : "minor",
      verdict:
        typeScore === 3
          ? "Strict type checking is on, which catches a whole class of agent mistakes before they run."
          : typeScore === 2
            ? "Type checking is configured, but not in strict mode."
            : "No static type checking.",
      fix:
        typeScore === 3
          ? undefined
          : tsconfigRaw && !strict
            ? 'Turn on `"strict": true`. Type errors are the fastest feedback an agent gets, and non-strict mode silently discards most of them.'
            : "A type checker gives an agent an error message instead of a runtime surprise. It's the second-fastest feedback loop after the compiler.",
    });
  }

  return tally("verification", "Verification loop", "Whether an agent can check its own work. This is the category that most decides whether agent output is trustworthy.", checks);
}
