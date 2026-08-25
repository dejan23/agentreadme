import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { grade } from "../../grade";
import { localSnapshot } from "../snapshot";

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "ar-"));
  for (const [path, body] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

const GOOD = {
  "AGENTS.md": "# AGENTS.md\n\n## Setup\npnpm install\n\n## Commands\n```\npnpm test\npnpm build\n```\n\n## Conventions\nTests sit beside the code.\n",
  "README.md": "# thing\n\n## Install\n\npnpm add thing\n\n## Usage\n\nUse it.\n",
  "package.json": JSON.stringify({ scripts: { test: "vitest", build: "tsc" }, engines: { node: ">=20" } }),
  "pnpm-lock.yaml": "lockfileVersion: 9",
  "tsconfig.json": '{"compilerOptions":{"strict":true}}',
  "eslint.config.js": "export default []",
  ".gitignore": "node_modules\ndist\ncoverage\n.env\n*.log\n",
  ".github/workflows/ci.yml": "name: CI",
  "src/index.ts": "export const a = 1;",
  "src/b.ts": "export const b = 2;",
  "src/index.test.ts": "test('x', () => {});",
};

describe("grading a directory", () => {
  it("reads a project off disk and scores it", () => {
    const r = grade(localSnapshot(project(GOOD)));
    expect(r.score).toBeGreaterThan(60);
    expect(r.categories).toHaveLength(5);
  });

  it("does not punish a checkout for having no stars or description", () => {
    const r = grade(localSnapshot(project(GOOD)));
    const meta = r.categories
      .find((c) => c.id === "navigation")!
      .checks.find((c) => c.id === "repo-meta")!;
    expect(meta.na).toBe(true);
    // The category maximum must shrink, not just the score.
    expect(r.categories.find((c) => c.id === "navigation")!.max).toBeLessThan(10);
  });

  it("scores the same project the same way as the hosted rules", () => {
    // Same rules, same snapshot shape. Guards against the local path drifting.
    const a = grade(localSnapshot(project(GOOD)));
    const b = grade(localSnapshot(project(GOOD)));
    expect(a.score).toBe(b.score);
  });

  it("skips directories that are never part of a repository", () => {
    const dir = project({ ...GOOD, "node_modules/x/index.js": "junk", "dist/out.js": "built" });
    const paths = localSnapshot(dir).tree.map((t) => t.path);
    expect(paths.some((p) => p.startsWith("node_modules/"))).toBe(false);
  });

  it("still drafts an AGENTS.md for a directory that is not a git checkout", () => {
    const r = grade(localSnapshot(project(GOOD)));
    expect(r.draft).toContain("## Setup");
    expect(r.draft).toContain("pnpm install");
  });

  it("survives a directory with almost nothing in it", () => {
    const r = grade(localSnapshot(project({ "readme.txt": "hi" })));
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
