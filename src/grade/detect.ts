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
  "vue", "svelte", "sh", "bash", "sql", "m", "mm", "dart", "zig", "lua", "pl", "r",
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
