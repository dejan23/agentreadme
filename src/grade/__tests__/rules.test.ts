import { describe, expect, it } from "vitest";
import { grade, letterGrade } from "../index";
import { projectShape } from "../detect";
import { GOOD_LIB, snap } from "./fixture";

const cat = (r: ReturnType<typeof grade>, id: string) =>
  r.categories.find((c) => c.id === id)!;
const check = (r: ReturnType<typeof grade>, catId: string, id: string) =>
  cat(r, catId).checks.find((c) => c.id === id)!;

describe("letterGrade", () => {
  it("maps the range monotonically", () => {
    expect(letterGrade(100)).toBe("A+");
    expect(letterGrade(72)).toBe("B+");
    expect(letterGrade(62)).toBe("B");
    expect(letterGrade(0)).toBe("F");
  });

  it("never decreases as the score rises", () => {
    const order = ["F", "D", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
    let last = -1;
    for (let s = 0; s <= 100; s++) {
      const i = order.indexOf(letterGrade(s));
      expect(i).toBeGreaterThanOrEqual(last);
      last = i;
    }
  });
});

describe("a well-run library", () => {
  const r = grade(snap(GOOD_LIB));

  it("scores highly", () => {
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("credits AGENTS.md with full marks", () => {
    expect(check(r, "instructions", "agents-file").score).toBe(12);
  });

  it("finds the test command", () => {
    expect(check(r, "verification", "test-command").score).toBeGreaterThan(0);
  });

  it("is classified as software", () => {
    expect(r.isSoftware).toBe(true);
  });
});

describe("not-applicable checks", () => {
  it("excludes env config from a library's total rather than scoring zero", () => {
    const r = grade(snap(GOOD_LIB));
    const env = check(r, "setup", "env-vars");
    expect(env.na).toBe(true);
    // The category max must shrink, not just the score.
    expect(cat(r, "setup").max).toBeLessThan(20);
  });

  it("does apply env config to something that reads as an application", () => {
    const r = grade(snap({ ...GOOD_LIB, Dockerfile: "FROM node:20" }));
    expect(check(r, "setup", "env-vars").na).toBeFalsy();
  });

  it("keeps not-applicable checks out of the fix list", () => {
    const r = grade(snap(GOOD_LIB));
    expect(r.topFixes.some((f) => f.na)).toBe(false);
  });
});

describe("instructions", () => {
  it("gives no credit when there is no instruction file", () => {
    const { "AGENTS.md": _, ...rest } = GOOD_LIB;
    const r = grade(snap(rest));
    expect(check(r, "instructions", "agents-file").score).toBe(0);
    expect(check(r, "instructions", "agents-file").severity).toBe("critical");
  });

  it("gives partial credit for a tool-specific file", () => {
    const { "AGENTS.md": agents, ...rest } = GOOD_LIB;
    const r = grade(snap({ ...rest, "CLAUDE.md": agents as string }));
    const c = check(r, "instructions", "agents-file");
    expect(c.score).toBeGreaterThan(0);
    expect(c.score).toBeLessThan(c.max);
  });

  it("marks down instructions that name no commands", () => {
    const r = grade(
      snap({ ...GOOD_LIB, "AGENTS.md": "# AGENTS.md\n\nThis is a TypeScript project. Write clean code and be careful. ".repeat(6) }),
    );
    const quality = check(r, "instructions", "instruction-quality");
    expect(quality.score).toBeLessThan(quality.max);
  });
});

describe("verification", () => {
  it("treats a missing test command as critical", () => {
    const { "package.json": _pkg, ...rest } = GOOD_LIB;
    const r = grade(snap({ ...rest, "package.json": JSON.stringify({ name: "widget" }) }));
    expect(check(r, "verification", "test-command").severity).toBe("critical");
  });

  it("finds pytest configured in pyproject.toml", () => {
    const r = grade(
      snap(
        {
          "pyproject.toml": "[tool.pytest.ini_options]\ntestpaths = ['tests']\n[tool.ruff]\n",
          "uv.lock": "version = 1",
          "src/app.py": "x = 1",
          "tests/test_app.py": "def test_x(): pass",
        },
        { language: "Python" },
      ),
    );
    expect(check(r, "verification", "test-command").score).toBeGreaterThan(0);
    expect(check(r, "verification", "lint").score).toBeGreaterThan(0);
  });
});

describe("context economy", () => {
  it("penalises committed build output", () => {
    const r = grade(snap({ ...GOOD_LIB, "node_modules/left-pad/index.js": "x" }));
    const c = check(r, "context", "artifacts");
    expect(c.score).toBeLessThan(c.max);
  });

  it("penalises a source file large enough to crowd a context window", () => {
    const r = grade(snap({ ...GOOD_LIB, "src/huge.ts": 400 * 1024 }));
    const c = check(r, "context", "file-size");
    expect(c.score).toBeLessThan(c.max);
    expect(c.evidence?.join(" ")).toContain("src/huge.ts");
  });
});

describe("project shape", () => {
  it("excludes a curated list that carries no engineering", () => {
    const s = snap(
      { "README.md": "# Awesome Python\n\n- [thing](https://example.com)\n".repeat(50) },
      { repo: "awesome-python", description: "A curated list of Python frameworks" },
    );
    expect(projectShape(s).isSoftware).toBe(false);
  });

  it("keeps a real application whose name happens to match a content word", () => {
    const s = snap({ ...GOOD_LIB, "src/roadmap.ts": "export const x = 1;" }, {
      repo: "roadmap-app",
      description: "An app for planning a roadmap",
    });
    expect(projectShape(s).isSoftware).toBe(true);
  });
});

describe("report invariants", () => {
  const cases = [GOOD_LIB, { "README.md": "hi" }, { ...GOOD_LIB, Dockerfile: "FROM node" }];

  it("never reports a score outside 0..100", () => {
    for (const files of cases) {
      const r = grade(snap(files));
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("never lets a check score exceed its own maximum", () => {
    for (const files of cases) {
      for (const c of grade(snap(files)).categories.flatMap((x) => x.checks)) {
        expect(c.score).toBeLessThanOrEqual(c.max);
        expect(c.score).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("gives every imperfect, applicable check a fix to act on", () => {
    for (const files of cases) {
      for (const c of grade(snap(files)).categories.flatMap((x) => x.checks)) {
        if (!c.na && c.score < c.max) expect(c.fix, `${c.id} has no fix`).toBeTruthy();
      }
    }
  });
});
