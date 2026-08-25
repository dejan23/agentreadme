import type { Report } from "../grade/types";
import { letterFor } from "./page";

const W = 58;

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}
function padStart(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}
function wrap(s: string, width: number, indent: string): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      lines.push(indent + line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) lines.push(indent + line.trim());
  return lines;
}

/**
 * The report as plain text. Exists so an agent can read its own scorecard with
 * one curl, and so the terminal block on the site shows a command that is real.
 */
export function reportText(r: Report): string {
  const out: string[] = [];
  const slug = `${r.owner}/${r.repo}`;

  out.push(`# ${slug} — ${r.score}/100 · ${r.grade}`);
  out.push("");

  if (!r.isSoftware) {
    out.push(`! not scored as software: ${r.shapeReason}`);
    out.push("");
  }

  for (const cat of r.categories) {
    const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
    const failed = pct < 55;
    const mark = failed ? "✗" : "✓";
    const score = `${cat.score}/${cat.max}`;
    out.push(`${mark} ${pad(cat.label, 22)}${padStart(score, 8)}   ${letterFor(pct)}`);
    if (failed) {
      const worst = cat.checks.find((c) => !c.na && c.score < c.max && c.fix);
      if (worst) out.push(...wrap(worst.verdict, W - 4, "  "));
    }
  }

  out.push("");
  out.push("# fix first");
  for (const f of r.topFixes.slice(0, 3)) {
    out.push(...wrap(f.fix ?? f.label, W - 4, "  ").map((l, i) => (i === 0 ? "+" + l.slice(1) : l)));
  }

  out.push("");
  out.push(`# full report: https://agentreadme.com/${slug}`);
  return out.join("\n") + "\n";
}
