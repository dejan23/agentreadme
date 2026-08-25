import type { Category, Check } from "./types";

/** Sums a category, excluding not-applicable checks from both sides of the ratio. */
export function tally(
  id: string,
  label: string,
  blurb: string,
  checks: Check[],
): Category {
  const live = checks.filter((c) => !c.na);
  return {
    id,
    label,
    blurb,
    score: live.reduce((a, c) => a + c.score, 0),
    max: live.reduce((a, c) => a + c.max, 0),
    checks,
  };
}
