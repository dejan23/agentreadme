import { describe, expect, it } from "vitest";
import { colorFor, errorBadge, gradeBadge } from "../badge";

describe("badge", () => {
  it("produces parseable svg", () => {
    const svg = gradeBadge(72, "B+");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).toContain("72/100 B+");
  });

  it("gets worse-looking as the score drops", () => {
    expect(colorFor(95)).not.toBe(colorFor(20));
    expect(colorFor(0)).toBe(colorFor(10));
  });

  it("escapes text rather than letting it close a tag", () => {
    // A repo cannot inject here today, but the badge is user-facing SVG and
    // this is the check that keeps it that way.
    const svg = gradeBadge(50, '"><script>alert(1)</script>');
    expect(svg).not.toContain("<script>");
  });

  it("still renders a badge when grading failed", () => {
    expect(errorBadge()).toContain("<svg");
  });

  it("widens to fit longer text instead of clipping", () => {
    const w = (svg: string) => Number(svg.match(/width="(\d+)"/)![1]);
    expect(w(gradeBadge(100, "A+"))).toBeGreaterThan(0);
    expect(w(gradeBadge(7, "F"))).toBeLessThan(w(gradeBadge(100, "A+")) + 40);
  });
});
