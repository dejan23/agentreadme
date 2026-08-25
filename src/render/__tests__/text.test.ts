import { describe, expect, it } from "vitest";
import { grade } from "../../grade";
import { GOOD_LIB, snap } from "../../grade/__tests__/fixture";
import { reportText } from "../text";

describe("reportText", () => {
  const text = reportText(grade(snap(GOOD_LIB)));

  it("leads with the repo and its mark", () => {
    expect(text.split("\n")[0]).toMatch(/^# acme\/widget — \d+\/100 · /);
  });

  it("wraps to a width a terminal can hold", () => {
    for (const line of text.split("\n")) expect(line.length).toBeLessThanOrEqual(62);
  });

  it("points back at the full report", () => {
    expect(text).toContain("agentreadme.com/acme/widget");
  });

  it("ends with a newline, the way a cli should", () => {
    expect(text.endsWith("\n")).toBe(true);
  });

  it("says plainly when something is not real software", () => {
    const list = snap(
      { "README.md": "# Awesome Things\n\n- [a](https://e.com)\n".repeat(40) },
      { repo: "awesome-things", description: "A curated list of things" },
    );
    expect(reportText(grade(list))).toContain("not scored as software");
  });
});
