import type { RepoMeta, RepoSnapshot, TreeEntry } from "../types";

/** Builds a snapshot from a plain file map, so a rule test reads like a repo. */
export function snap(
  files: Record<string, string | number>,
  meta: Partial<RepoMeta> = {},
): RepoSnapshot {
  const tree: TreeEntry[] = Object.entries(files).map(([path, v]) => ({
    path,
    type: "blob",
    size: typeof v === "number" ? v : v.length,
  }));

  const byPath = new Map<string, TreeEntry>();
  for (const e of tree) byPath.set(e.path.toLowerCase(), e);

  const contents = new Map<string, string>();
  for (const [path, v] of Object.entries(files)) {
    if (typeof v === "string") contents.set(path.toLowerCase(), v);
  }

  return {
    meta: {
      owner: "acme",
      repo: "widget",
      defaultBranch: "main",
      stars: 1234,
      language: "TypeScript",
      description: "A widget library for making widgets",
      topics: ["widgets", "typescript"],
      license: "MIT",
      sizeKb: 2000,
      archived: false,
      fork: false,
      pushedAt: "2026-08-01T00:00:00Z",
      ...meta,
    },
    tree,
    truncatedTree: false,
    byPath,
    files: contents,
  };
}

/** A well-run TypeScript library that should score highly. */
export const GOOD_LIB: Record<string, string | number> = {
  "AGENTS.md": `# AGENTS.md\n\n## Setup\npnpm install\n\n## Commands\n\`\`\`\npnpm test\npnpm build\npnpm typecheck\n\`\`\`\n\n## Conventions\nTests sit beside the file they cover.\n`,
  "README.md": "# widget\n\n## Install\n\npnpm add widget\n\n## Usage\n\nCall it.\n",
  "package.json": JSON.stringify({
    name: "widget",
    scripts: { test: "vitest run", build: "tsc", typecheck: "tsc --noEmit" },
    engines: { node: ">=20" },
  }),
  "pnpm-lock.yaml": "lockfileVersion: 9",
  "tsconfig.json": '{"compilerOptions":{"strict":true}}',
  "eslint.config.js": "export default []",
  ".gitignore": "node_modules\ndist\n.env\ncoverage\n*.log\n.DS_Store\n",
  ".nvmrc": "20",
  ".github/workflows/ci.yml": "name: CI",
  "src/index.ts": "export const widget = 1;",
  "src/core.ts": "export const core = 2;",
  "src/util.ts": "export const util = 3;",
  "src/index.test.ts": "test('works', () => {});",
  "src/core.test.ts": "test('works', () => {});",
};
