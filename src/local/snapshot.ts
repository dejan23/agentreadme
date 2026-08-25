import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import type { RepoMeta, RepoSnapshot, TreeEntry } from "../grade/types";

/**
 * Builds a snapshot from a directory on disk.
 *
 * The rules are pure over RepoSnapshot and never touch the network, so the
 * identical rubric runs here. That is the whole point: private code is graded
 * where it already lives and never leaves the machine.
 */

/** Never walked. Cheap to skip and enormous when present. */
const SKIP_DIRS = new Set([
  ".git", "node_modules", ".wrangler", ".next", ".nuxt", ".svelte-kit", ".turbo",
  "__pycache__", ".venv", "venv", ".tox", ".mypy_cache", ".pytest_cache", ".ruff_cache",
  "target", ".gradle", ".idea", ".vscode-test", "vendor", ".terraform", ".cache",
  "coverage", ".nyc_output", "Pods", "DerivedData", ".dart_tool",
]);

const WANTED = [
  "AGENTS.md", "CLAUDE.md", ".cursorrules", ".github/copilot-instructions.md",
  "README.md", "package.json", ".gitignore", "Makefile", "justfile", "Taskfile.yml",
  "tsconfig.json", "pyproject.toml", "setup.cfg", "Cargo.toml", "go.mod",
  "pytest.ini", "tox.ini", "CONTRIBUTING.md",
];

const MAX_FILE_BYTES = 96 * 1024;
/** A guard against walking somewhere enormous by accident. */
const MAX_ENTRIES = 60_000;

/**
 * Exactly what git tracks.
 *
 * Walking the filesystem grades files the repository does not contain: build
 * output, local caches, anything gitignored. That both punishes people for
 * files they never committed and disagrees with the hosted result, which sees
 * only what is pushed. Asking git removes the whole class of problem.
 */
function gitTracked(root: string): TreeEntry[] | null {
  try {
    const out = execFileSync("git", ["-C", root, "ls-files", "-z"], {
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const paths = out.toString("utf8").split("\0").filter(Boolean);
    if (!paths.length) return null;

    const tree: TreeEntry[] = [];
    for (const p of paths) {
      try {
        tree.push({ path: p, type: "blob", size: statSync(join(root, p)).size });
      } catch {
        /* tracked but missing from the working tree */
      }
    }
    return tree.length ? tree : null;
  } catch {
    return null; // not a git checkout, or git is not installed
  }
}

function walk(root: string): { tree: TreeEntry[]; truncated: boolean } {
  const tree: TreeEntry[] = [];
  const stack = [root];
  let truncated = false;

  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue; // unreadable directory, not worth failing the whole run
    }

    for (const name of entries) {
      if (tree.length >= MAX_ENTRIES) {
        truncated = true;
        return { tree, truncated };
      }
      const full = join(dir, name);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue; // broken symlink
      }

      if (st.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        stack.push(full);
      } else if (st.isFile()) {
        tree.push({
          path: relative(root, full).split(sep).join("/"),
          type: "blob",
          size: st.size,
        });
      }
    }
  }
  return { tree, truncated };
}

/** Best effort owner/repo from the git remote, so the report has a real name. */
function nameFromGit(root: string, fallback: string): { owner: string; repo: string } {
  try {
    const cfg = readFileSync(join(root, ".git", "config"), "utf8");
    const m = cfg.match(/url\s*=\s*(?:https?:\/\/[^/]+\/|git@[^:]+:)([^/\s]+)\/([^\s.]+)/);
    if (m) return { owner: m[1], repo: m[2] };
  } catch {
    /* not a git checkout, or no remote */
  }
  return { owner: "local", repo: fallback };
}

/** The dominant source language, so language-specific checks still apply. */
function guessLanguage(tree: TreeEntry[]): string | null {
  const byExt: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    py: "Python", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin", rb: "Ruby",
    php: "PHP", cs: "C#", swift: "Swift", c: "C", h: "C", cpp: "C++", cc: "C++",
    ex: "Elixir", scala: "Scala", dart: "Dart", sh: "Shell",
  };
  const count = new Map<string, number>();
  for (const e of tree) {
    const ext = e.path.slice(e.path.lastIndexOf(".") + 1).toLowerCase();
    const lang = byExt[ext];
    if (lang) count.set(lang, (count.get(lang) ?? 0) + 1);
  }
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

function detectLicense(root: string, byPath: Map<string, TreeEntry>): string | null {
  const name = ["license", "license.md", "license.txt", "licence", "copying"].find((n) => byPath.has(n));
  if (!name) return null;
  try {
    const text = readFileSync(join(root, byPath.get(name)!.path), "utf8").slice(0, 400);
    if (/MIT License/i.test(text)) return "MIT";
    if (/Apache License/i.test(text)) return "Apache-2.0";
    if (/GNU GENERAL PUBLIC/i.test(text)) return "GPL";
    if (/BSD/i.test(text)) return "BSD";
    if (/Mozilla Public/i.test(text)) return "MPL-2.0";
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

export function localSnapshot(dir: string): RepoSnapshot {
  const root = resolve(dir);
  // Prefer what git tracks. Fall back to walking for a directory that is not a
  // checkout at all, which still needs to be gradeable.
  const tracked = gitTracked(root);
  const { tree, truncated } = tracked ? { tree: tracked, truncated: false } : walk(root);

  const byPath = new Map<string, TreeEntry>();
  for (const e of tree) byPath.set(e.path.toLowerCase(), e);

  const files = new Map<string, string>();
  const wanted = WANTED.map((w) => byPath.get(w.toLowerCase()));

  const rootReadme = tree.find((e) => /^readme(\.(md|markdown|rst|txt))?$/i.test(e.path));
  if (rootReadme) wanted.push(rootReadme);

  for (const e of wanted) {
    if (!e || (e.size ?? 0) > MAX_FILE_BYTES) continue;
    try {
      files.set(e.path.toLowerCase(), readFileSync(join(root, e.path), "utf8"));
    } catch {
      /* unreadable, treat as absent */
    }
  }

  const { owner, repo } = nameFromGit(root, basename(root) || "repo");
  const sizeKb = Math.round(tree.reduce((a, e) => a + (e.size ?? 0), 0) / 1024);

  const meta: RepoMeta = {
    owner,
    repo,
    defaultBranch: "local",
    language: guessLanguage(tree),
    license: detectLicense(root, byPath),
    sizeKb,
    archived: false,
    fork: false,
    pushedAt: null,
    // Stars, description, and topics belong to GitHub, not to a repository.
    // Marking them absent here would dock every private project for something
    // it cannot have, so the rules treat these as not applicable in local mode.
    stars: -1,
    description: null,
    topics: [],
  };

  return { meta, tree, truncatedTree: truncated, byPath, files };
}

/** True when this snapshot came from disk rather than the GitHub API. */
export function isLocal(s: RepoSnapshot): boolean {
  return s.meta.stars === -1 && s.meta.defaultBranch === "local";
}
