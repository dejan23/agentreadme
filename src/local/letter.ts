/** Same curve as the site, duplicated here so the CLI pulls in no render code. */
export function letterFor(pct: number): string {
  if (pct >= 93) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 78) return "A-";
  if (pct >= 70) return "B+";
  if (pct >= 62) return "B";
  if (pct >= 55) return "B-";
  if (pct >= 48) return "C+";
  if (pct >= 40) return "C";
  if (pct >= 30) return "D";
  return "F";
}
