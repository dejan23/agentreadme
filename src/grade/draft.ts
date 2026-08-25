import { blobs, ciWorkflows, file, has, hasAny, isSource, pkg, pyproject, testFiles, LOCKFILES } from "./detect";
import type { RepoSnapshot } from "./types";

/** Install command implied by whichever lockfile is committed. */
function installCommand(s: RepoSnapshot): { cmd: string; runner: string } | null {
  const map: Array<[string, string, string]> = [
    ["pnpm-lock.yaml", "pnpm install", "pnpm"],
    ["yarn.lock", "yarn install", "yarn"],
    ["bun.lock", "bun install", "bun"],
    ["bun.lockb", "bun install", "bun"],
    ["package-lock.json", "npm ci", "npm run"],
    ["uv.lock", "uv sync", "uv run"],
    ["poetry.lock", "poetry install", "poetry run"],
    ["Pipfile.lock", "pipenv install", "pipenv run"],
    ["Cargo.lock", "cargo build", "cargo"],
    ["go.sum", "go mod download", "go"],
    ["Gemfile.lock", "bundle install", "bundle exec"],
    ["composer.lock", "composer install", "composer"],
    ["mix.lock", "mix deps.get", "mix"],
    ["pubspec.lock", "dart pub get", "dart"],
  ];
  for (const [lock, cmd, runner] of map) if (has(s, lock)) return { cmd, runner };
  if (has(s, "requirements.txt")) return { cmd: "pip install -r requirements.txt", runner: "python" };
  if (has(s, "package.json")) return { cmd: "npm install", runner: "npm run" };
  return null;
}

/** The commands a maintainer actually declared, in the order that matters most. */
function commands(s: RepoSnapshot, runner: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const p = pkg(s);
  const scripts: Record<string, string> = p?.scripts ?? {};
  const pick = ["dev", "start", "build", "test", "typecheck", "lint", "format", "check"];

  for (const key of pick) {
    if (typeof scripts[key] === "string") out.push([`${runner} ${key}`, describe(key)]);
  }
  // Anything else declared, so the file reflects the repo rather than a template.
  for (const key of Object.keys(scripts)) {
    if (!pick.includes(key) && out.length < 8) out.push([`${runner} ${key}`, ""]);
  }

  if (out.length === 0) {
    const mk = file(s, "Makefile") ?? file(s, "makefile");
    if (mk) {
      for (const m of mk.matchAll(/^([a-z][a-z0-9_-]{1,20})\s*:/gm)) {
        if (out.length < 6 && !["phony", "all"].includes(m[1])) out.push([`make ${m[1]}`, describe(m[1])]);
      }
    }
  }

  if (out.length === 0) {
    const py = pyproject(s);
    if (py && /\[tool\.(pytest|ruff)/.test(py)) {
      if (/\[tool\.pytest/.test(py)) out.push(["pytest", "run the test suite"]);
      if (/\[tool\.ruff/.test(py)) out.push(["ruff check .", "lint"]);
    }
    if (has(s, "go.mod")) out.push(["go test ./...", "run the test suite"]);
    if (has(s, "Cargo.toml")) out.push(["cargo test", "run the test suite"]);
  }
  return out;
}

function describe(key: string): string {
  const m: Record<string, string> = {
    dev: "run locally",
    start: "run the app",
    build: "produce a build",
    test: "run the test suite, must pass before any commit",
    typecheck: "type check without emitting",
    lint: "lint",
    format: "format",
    check: "lint and type check",
  };
  return m[key] ?? "";
}

/** Top-level directories, so an agent knows where things live. */
function layout(s: RepoSnapshot): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const e of blobs(s)) {
    const top = e.path.includes("/") ? e.path.slice(0, e.path.indexOf("/")) : null;
    if (!top || top.startsWith(".")) continue;
    counts.set(top, (counts.get(top) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

/**
 * Drafts an AGENTS.md for this specific repository.
 *
 * Everything here is read out of the repo, never invented. Where something
 * cannot be determined it is left as a marked blank for a human, because a
 * confident wrong command is worse than an obvious gap.
 */
export function draftAgentsMd(s: RepoSnapshot): string {
  const install = installCommand(s);
  const cmds = commands(s, install?.runner ?? "npm run");
  const tests = testFiles(s);
  const ci = ciWorkflows(s);
  const dirs = layout(s);
  const out: string[] = [];

  out.push("# AGENTS.md", "");
  out.push(
    s.meta.description
      ? `${s.meta.description}`
      : `${s.meta.repo}. Replace this line with one sentence on what the project is.`,
    "",
  );

  out.push("## Setup", "");
  if (install) {
    out.push("```", install.cmd, "```", "");
  } else {
    out.push("```", "# TODO: the install command. No lockfile was found, so this could not be inferred.", "```", "");
  }

  out.push("## Commands", "");
  if (cmds.length) {
    out.push("```");
    const width = Math.max(...cmds.map(([c]) => c.length));
    for (const [cmd, note] of cmds) out.push(note ? `${cmd.padEnd(width)}   # ${note}` : cmd);
    out.push("```", "");
  } else {
    out.push(
      "```",
      "# TODO: nothing declares a build or test command, so an agent has to guess.",
      "# This is the single most valuable section of this file. Fill it in.",
      "```",
      "",
    );
  }

  if (dirs.length) {
    out.push("## Layout", "");
    const width = Math.max(...dirs.map(([d]) => d.length));
    for (const [dir, n] of dirs) out.push(`- \`${dir}/\`${" ".repeat(Math.max(0, width - dir.length))} ${n} files`);
    out.push("");
  }

  out.push("## Conventions", "");
  const conv: string[] = [];
  if (tests.length) {
    const sample = tests[0].path;
    conv.push(`- Tests live alongside the code they cover, following \`${sample}\`.`);
  } else {
    conv.push("- There are no tests yet. An agent has no way to check its own work here.");
  }
  const tsconfig = file(s, "tsconfig.json");
  if (tsconfig) {
    conv.push(
      /"strict"\s*:\s*true/.test(tsconfig)
        ? "- TypeScript runs in strict mode. Type errors are the fastest feedback available, so do not weaken it."
        : "- TypeScript is not in strict mode. Turning it on catches a whole class of mistakes before they run.",
    );
  }
  if (ci.length) conv.push(`- CI defines what passing means. See \`${ci[0].path}\`, and keep it green.`);
  conv.push("- TODO: add the two or three conventions a newcomer always gets wrong here.");
  out.push(...conv, "");

  const gotchas: string[] = [];
  const artifacts = blobs(s).find((e) => /^(dist|build|out|\.next)\//i.test(e.path));
  if (artifacts) {
    gotchas.push(
      `- Generated output is committed (\`${artifacts.path.split("/")[0]}/\`). Search will return the compiled copy, so edit the source, not that.`,
    );
  }
  const big = blobs(s)
    .filter((e) => isSource(e.path) && (e.size ?? 0) > 100 * 1024)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0];
  if (big) {
    gotchas.push(
      `- \`${big.path}\` is ${Math.round((big.size ?? 0) / 1024)}KB. It will not fit comfortably in context, so read it in parts.`,
    );
  }
  const envExample = hasAny(s, [".env.example", ".env.sample", ".dev.vars.example"]);
  if (envExample) gotchas.push(`- Copy \`${envExample}\` before running anything that needs configuration.`);
  if (!hasAny(s, LOCKFILES)) {
    gotchas.push("- No lockfile is committed, so an install here may not match what CI produced.");
  }
  if (gotchas.length) out.push("## Gotchas", "", ...gotchas, "");

  out.push("---", "");
  out.push(
    `Drafted by agentreadme.com from what is in this repository. Everything marked TODO`,
    `needs a human. Check it in as AGENTS.md at the root.`,
  );
  return out.join("\n") + "\n";
}
