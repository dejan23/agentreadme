import type { RepoSnapshot, TreeEntry } from "./types";

export const LOCKFILES = [
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock",
  "uv.lock", "poetry.lock", "pipfile.lock", "cargo.lock", "go.sum",
  "composer.lock", "gemfile.lock", "mix.lock", "pubspec.lock", "gradle.lockfile",
];

export const RUNTIME_PINS = [
  ".nvmrc", ".node-version", ".python-version", ".tool-versions",
  "rust-toolchain", "rust-toolchain.toml", ".ruby-version", ".java-version", ".sdkmanrc",
];

export const CI_FILES = [
  ".gitlab-ci.yml", ".circleci/config.yml", "azure-pipelines.yml",
  "jenkinsfile", ".drone.yml", ".travis.yml", "cloudbuild.yaml",
];

export const LINTER_FILES = [
  "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts",
  ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.cjs",
  "biome.json", "biome.jsonc", "ruff.toml", ".ruff.toml", ".flake8",
  ".golangci.yml", ".golangci.yaml", "clippy.toml", ".clippy.toml",
  ".rubocop.yml", ".php-cs-fixer.php", ".swiftlint.yml", "detekt.yml",
];

export const TYPECHECK_FILES = [
  "tsconfig.json", "jsconfig.json", "mypy.ini", ".mypy.ini",
  "pyrightconfig.json", "sorbet/config",
];

export const ENV_EXAMPLES = [
  ".env.example", ".env.sample", ".env.template", ".env.dist",
  "env.example", ".env.local.example",
  // Cloudflare Workers projects document their environment here.
  ".dev.vars.example", ".dev.vars.sample",
];

export const DEVCONTAINER = [
  ".devcontainer/devcontainer.json", ".devcontainer.json",
  "dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yaml", "compose.yml",
];

/** Directories that should essentially never be committed. */
export const ARTIFACT_DIRS: Array<{ dir: string; label: string }> = [
  { dir: "node_modules/", label: "node_modules/" },
  { dir: ".next/", label: ".next/" },
  { dir: ".nuxt/", label: ".nuxt/" },
  { dir: "__pycache__/", label: "__pycache__/" },
  { dir: ".venv/", label: ".venv/" },
  { dir: "venv/", label: "venv/" },
  { dir: "coverage/", label: "coverage/" },
  { dir: ".pytest_cache/", label: ".pytest_cache/" },
  { dir: ".gradle/", label: ".gradle/" },
  { dir: ".terraform/", label: ".terraform/" },
];

/** Extensions we treat as hand-written source for size and count heuristics. */
const SOURCE_EXT = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java", "kt",
  "swift", "c", "h", "cc", "cpp", "hpp", "cs", "php", "scala", "ex", "exs",
  "vue", "svelte", "astro", "sh", "bash", "sql", "m", "mm", "dart", "zig", "lua", "pl", "r",
  "hs", "jl", "nim", "clj", "cljs", "erl", "elm", "fs", "ml", "groovy", "sol", "v", "cr",
]);

/** Paths that are real source but that nobody hand-maintains. */
const GENERATED_HINTS = [
  ".min.js", ".min.css", "-lock.json", ".pb.go", "_pb2.py", ".generated.",
  ".g.dart", ".freezed.dart", "/migrations/", "/vendor/", "/third_party/",
  ".snap", "-snapshot", "/dist/", "/build/", "/out/",
];

export function ext(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const i = base.lastIndexOf(".");
  return i <= 0 ? "" : base.slice(i + 1).toLowerCase();
}

export function isSource(path: string): boolean {
  if (!SOURCE_EXT.has(ext(path))) return false;
  const lower = path.toLowerCase();
  return !GENERATED_HINTS.some((h) => lower.includes(h));
}

export function has(s: RepoSnapshot, path: string): boolean {
  return s.byPath.has(path.toLowerCase());
}

export function hasAny(s: RepoSnapshot, paths: string[]): string | null {
  for (const p of paths) if (has(s, p)) return p;
  return null;
}

export function blobs(s: RepoSnapshot): TreeEntry[] {
  return s.tree.filter((e) => e.type === "blob");
}

export function matching(s: RepoSnapshot, re: RegExp): TreeEntry[] {
  return s.tree.filter((e) => e.type === "blob" && re.test(e.path));
}

export function file(s: RepoSnapshot, path: string): string | null {
  return s.files.get(path.toLowerCase()) ?? null;
}

/** package.json parsed once, tolerantly. */
export function pkg(s: RepoSnapshot): any | null {
  const raw = file(s, "package.json");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readme(s: RepoSnapshot): string | null {
  for (const [path, body] of s.files) {
    if (/^readme(\.(md|markdown|rst|txt))?$/.test(path)) return body;
  }
  return null;
}

/** True if any file anywhere in the tree matches. Cheap enough at this size. */
export function existsAnywhere(s: RepoSnapshot, re: RegExp): boolean {
  return s.tree.some((e) => e.type === "blob" && re.test(e.path));
}

/** pyproject.toml as raw text; nearly every Python signal now lives here. */
export function pyproject(s: RepoSnapshot): string | null {
  return file(s, "pyproject.toml");
}

export function ciWorkflows(s: RepoSnapshot): TreeEntry[] {
  return matching(s, /^\.github\/workflows\/.+\.(ya?ml)$/i);
}

export function testFiles(s: RepoSnapshot): TreeEntry[] {
  return matching(
    s,
    /(^|\/)(tests?|spec|specs|__tests__)\/|(^|\/)test_[^/]+\.(py|rb)$|[._-](test|spec)\.[a-z]+$|_test\.(go|py|rb|ts|js)$/i,
  );
}

const DEPLOY_CONFIGS = [
  "dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yaml",
  "wrangler.toml", "wrangler.json", "wrangler.jsonc", "vercel.json", "netlify.toml",
  "fly.toml", "procfile", "app.yaml", "render.yaml", "railway.json", "serverless.yml",
];

const SERVER_DEPS = /\b(express|fastify|koa|hapi|next|nuxt|nest|remix|hono|django|flask|fastapi|starlette|rails|gin|echo|actix-web|axum|phoenix)\b/i;

/**
 * Does this project actually run as an application or service?
 * Libraries legitimately have no environment config, and docking them for it
 * is the fastest way to lose an argument about the score.
 */
export function isApplication(s: RepoSnapshot): boolean {
  if (hasAny(s, DEPLOY_CONFIGS)) return true;
  if (existsAnywhere(s, /^(k8s|kubernetes|deploy|helm|charts|infra|terraform)\//i)) return true;

  const p = pkg(s);
  if (p) {
    const scripts = p.scripts ?? {};
    if (typeof scripts.start === "string" || typeof scripts.serve === "string") return true;
    const deps = Object.keys({ ...(p.dependencies ?? {}) }).join(" ");
    if (SERVER_DEPS.test(deps)) return true;
  }

  const py = pyproject(s);
  if (py && SERVER_DEPS.test(py)) return true;

  return false;
}

/** Does anything in the repo suggest it reads environment variables at all? */
export function mentionsEnv(s: RepoSnapshot): boolean {
  const rm = readme(s) ?? "";
  if (/\b(environment variable|process\.env|os\.environ|os\.getenv|dotenv|\.env\b)/i.test(rm)) return true;
  return existsAnywhere(s, /(^|\/)\.env($|\.)/i);
}

/** A dependency manifest is the strongest single signal of installable software. */
const MANIFESTS = [
  "package.json", "deno.json", "deno.jsonc", "pyproject.toml", "setup.py", "setup.cfg",
  "requirements.txt", "cargo.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts",
  "gemfile", "composer.json", "mix.exs", "pubspec.yaml", "package.swift", "cmakelists.txt",
  "build.sbt", "project.clj", "dune-project", "rebar.config", "nimble.toml", "meson.build",
];

export interface ProjectShape {
  isSoftware: boolean;
  /** Why we decided, shown to the reader rather than hidden. */
  reason: string;
  sourceCount: number;
  docRatio: number;
}

/**
 * Distinguishes real software from awesome-lists, tutorials, and book repos.
 *
 * The most-starred repositories on GitHub are overwhelmingly curated link
 * collections, and scoring them on "can an agent install and test this" is
 * meaningless. They are graded but kept off the leaderboard.
 */
const CONTENT_NAME =
  /\b(awesome|cheat-?sheets?|tutorials?|curated|collection|resources?|interview|books?|courses?|learn(ing)?|guides?|primer|handbook|notes|papers|links|roadmap|examples?|exercises|challenges|questions|100-?days|30-?days|list of|every-?programmer|design-?patterns)\b/i;

/** A real library or app has at least one of these. Content repos have none. */
function hasEngineering(s: RepoSnapshot): boolean {
  if (hasAny(s, LOCKFILES)) return true;
  if (ciWorkflows(s).length > 0 || hasAny(s, CI_FILES)) return true;
  if (testFiles(s).length > 0) return true;
  return false;
}

export function projectShape(s: RepoSnapshot): ProjectShape {
  const all = blobs(s);
  const sources = all.filter((e) => isSource(e.path));
  const docs = all.filter((e) => /\.(md|mdx|markdown|rst|txt)$/i.test(e.path));
  const docRatio = all.length > 0 ? docs.length / all.length : 0;
  const manifest = hasAny(s, MANIFESTS);

  // Tutorials, cheatsheets, and curated lists often ship real code samples, so
  // file counts alone call them software. What they never have is engineering
  // around that code: no lockfile, no CI, no tests.
  const named = `${s.meta.repo} ${s.meta.description ?? ""}`;
  // A dependency manifest is the cleanest divider here: curated lists and
  // tutorials do not ship one, real projects do. Counting source files instead
  // punished small applications that happen to carry a content word in the name.
  if (CONTENT_NAME.test(named) && !manifest && (!hasEngineering(s) || sources.length < 20)) {
    return {
      isSoftware: false,
      reason: hasEngineering(s)
        ? `it presents as a list, tutorial, or reference, ships no dependency manifest, and holds only ${sources.length} source files`
        : "it presents as a list, tutorial, or reference and carries no manifest, lockfile, CI, or tests",
      sourceCount: sources.length,
      docRatio,
    };
  }

  if (manifest && sources.length >= 3) {
    return { isSoftware: true, reason: `${manifest} plus ${sources.length} source files`, sourceCount: sources.length, docRatio };
  }
  if (sources.length >= 20) {
    return { isSoftware: true, reason: `${sources.length} source files`, sourceCount: sources.length, docRatio };
  }
  if (docRatio > 0.6 && sources.length < 10) {
    return {
      isSoftware: false,
      reason: `${Math.round(docRatio * 100)}% of files are prose and there are only ${sources.length} source files, so this reads as a documentation or list repository`,
      sourceCount: sources.length,
      docRatio,
    };
  }
  if (sources.length < 3 && !manifest) {
    return { isSoftware: false, reason: `no dependency manifest and only ${sources.length} source files`, sourceCount: sources.length, docRatio };
  }
  return { isSoftware: true, reason: `${sources.length} source files`, sourceCount: sources.length, docRatio };
}

/**
 * True when this snapshot was built from a directory rather than the GitHub
 * API. Local runs cannot know stars, description, or topics, so checks that
 * depend on them are marked not applicable instead of scored zero.
 */
export function isLocalSnapshot(s: RepoSnapshot): boolean {
  return s.meta.stars === -1 && s.meta.defaultBranch === "local";
}

/**
 * Languages whose compiler enforces types, so a separate type checker is
 * meaningless. Grading a Go or Rust project for the absence of a tsconfig
 * docked 96% and 79% of them respectively for something their toolchain
 * already does, which is the rubric being wrong rather than the repo.
 */
const COMPILED_TYPED: Array<{ manifest: string; name: string }> = [
  { manifest: "go.mod", name: "Go" },
  { manifest: "cargo.toml", name: "Rust" },
  { manifest: "pom.xml", name: "Java" },
  { manifest: "build.gradle", name: "Java" },
  { manifest: "build.gradle.kts", name: "Kotlin" },
  { manifest: "package.swift", name: "Swift" },
  { manifest: "build.sbt", name: "Scala" },
  { manifest: "mix.exs", name: "Elixir" },
];

const TYPED_LANGUAGES = new Set([
  "go", "rust", "java", "kotlin", "swift", "scala", "c", "c++", "c#", "haskell",
  "objective-c", "dart", "zig", "ocaml", "f#", "elm",
]);

/** True when the toolchain type checks on every build, without extra config. */
export function compilerTypeChecks(s: RepoSnapshot): string | null {
  const hit = COMPILED_TYPED.find((c) => has(s, c.manifest));
  if (hit) return hit.name;
  const lang = (s.meta.language ?? "").toLowerCase();
  if (TYPED_LANGUAGES.has(lang)) return s.meta.language;
  return null;
}
