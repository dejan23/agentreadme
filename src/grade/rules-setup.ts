import type { Category, Check, RepoSnapshot } from "./types";
import { DEVCONTAINER, ENV_EXAMPLES, LOCKFILES, RUNTIME_PINS, existsAnywhere, file, has, hasAny, isApplication, matching, mentionsEnv, pkg, pyproject, readme } from "./detect";
import { tally } from "./tally";

export function gradeSetup(s: RepoSnapshot): Category {
  const checks: Check[] = [];

  // --- Deterministic install ---
  const lock = hasAny(s, LOCKFILES);
  const hasReqTxt = has(s, "requirements.txt");
  checks.push({
    id: "lockfile",
    label: "Deterministic install",
    score: lock ? 6 : hasReqTxt ? 3 : 0,
    max: 6,
    severity: lock ? undefined : "major",
    verdict: lock
      ? `${lock} pins the dependency tree.`
      : hasReqTxt
        ? "Only requirements.txt, which pins loosely at best."
        : "No lockfile. An agent installing dependencies may not get what CI got.",
    fix: lock
      ? undefined
      : "Commit the lockfile your package manager generates. Without it, an agent's install and your install are different builds, and 'works on my machine' becomes unfalsifiable.",
    evidence: lock ? [`Found ${lock}`] : undefined,
  });

  // --- Is there a task runner an agent can discover? ---
  const p = pkg(s);
  const scripts = p?.scripts && typeof p.scripts === "object" ? Object.keys(p.scripts) : [];
  const makefile = has(s, "Makefile") || has(s, "makefile");
  const just = has(s, "justfile") || has(s, "Justfile");
  const taskfile = has(s, "Taskfile.yml") || has(s, "Taskfile.yaml");

  // Python projects declare their commands in pyproject.toml or a scripts/ dir
  // rather than package.json. Missing these marked half of PyPI as unrunnable.
  const py = pyproject(s);
  const pyScripts = py ? /\[tool\.(pdm\.scripts|poetry\.scripts|hatch\.envs[^\]]*scripts)\]|\[project\.scripts\]/.test(py) : false;
  const scriptsDir = existsAnywhere(s, /^scripts\/[^/]+\.(sh|py|js|ts)$/);

  const runner = scripts.length > 0 || makefile || just || taskfile || pyScripts || scriptsDir;
  const runnerBits: string[] = [];
  if (scripts.length) runnerBits.push(`package.json scripts (${scripts.slice(0, 6).join(", ")}${scripts.length > 6 ? "…" : ""})`);
  if (makefile) runnerBits.push("Makefile");
  if (just) runnerBits.push("justfile");
  if (taskfile) runnerBits.push("Taskfile");
  if (pyScripts) runnerBits.push("pyproject.toml scripts");
  if (scriptsDir) runnerBits.push("scripts/ directory");

  checks.push({
    id: "task-runner",
    label: "Discoverable commands",
    score: runner ? 6 : 0,
    max: 6,
    severity: runner ? undefined : "major",
    verdict: runner
      ? "Commands are declared where an agent will look for them."
      : "No declared commands. An agent has to infer how to build and run this from the file tree.",
    fix: runner
      ? undefined
      : "Declare the handful of commands that matter in package.json scripts, a Makefile, or a justfile. Naming them turns guesswork into a lookup.",
    evidence: runnerBits.length ? runnerBits : undefined,
  });

  // --- Environment variables ---
  const envExample = hasAny(s, ENV_EXAMPLES);
  const rm = readme(s) ?? "";
  const envInReadme = /\b[A-Z][A-Z0-9_]{4,}\b\s*=/.test(rm) || /environment variable/i.test(rm);
  const needsEnv = isApplication(s) || mentionsEnv(s) || !!envExample;
  const envScore = envExample ? 4 : envInReadme ? 2 : 0;

  if (!needsEnv) {
    checks.push({
      id: "env-vars",
      label: "Environment config",
      score: 0,
      max: 4,
      na: true,
      verdict: "Not applicable — this reads as a library, with no environment to configure.",
    });
  } else {
    checks.push({
      id: "env-vars",
      label: "Environment config",
      score: envScore,
      max: 4,
      severity: envScore >= 4 ? undefined : envScore > 0 ? "minor" : "major",
      verdict: envExample
        ? `${envExample} documents what the app needs to run.`
        : envInReadme
          ? "Env vars are mentioned in the README but there's no example file to copy."
          : "Nothing documents the environment this needs. An agent will get a runtime error it can't diagnose.",
      fix: envExample
        ? undefined
        : "Add a .env.example listing every variable with a safe placeholder value. It's the cheapest possible fix and it unblocks the whole first run.",
    });
  }

  // --- Pinned runtime ---
  const pin = hasAny(s, RUNTIME_PINS);
  const engines = p?.engines?.node ? `package.json engines.node ${p.engines.node}` : null;
  const goMod = has(s, "go.mod");
  const pinned = pin || engines || goMod;
  checks.push({
    id: "runtime-pin",
    label: "Pinned runtime version",
    score: pinned ? 2 : 0,
    max: 2,
    severity: pinned ? undefined : "minor",
    verdict: pinned ? "The language runtime version is pinned." : "No pinned runtime version.",
    fix: pinned ? undefined : "Add a .nvmrc, .python-version, or equivalent so the agent's toolchain matches yours.",
    evidence: pin ? [`Found ${pin}`] : engines ? [engines] : goMod ? ["go.mod declares a Go version"] : undefined,
  });

  // --- Container / devcontainer ---
  const container = hasAny(s, DEVCONTAINER);
  if (!container && !isApplication(s)) {
    checks.push({
      id: "container",
      label: "Reproducible environment",
      score: 0,
      max: 2,
      na: true,
      verdict: "Not applicable — a library doesn't need a container to be worked on.",
    });
  } else {
    checks.push({
      id: "container",
      label: "Reproducible environment",
      score: container ? 2 : 0,
      max: 2,
      severity: container ? undefined : "polish",
      verdict: container ? `${container} gives a known-good environment.` : "No container or devcontainer definition.",
      fix: container ? undefined : "A Dockerfile or devcontainer removes an entire class of 'it won't install' failures.",
    });
  }

  return tally("setup", "Setup", "Whether an agent can install the project and get it running without a human.", checks);
}
