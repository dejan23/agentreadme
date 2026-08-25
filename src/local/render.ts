import type { Report } from "../grade/types";
import { letterFor } from "./letter";

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[38;5;202m",
  grey: "\x1b[38;5;245m",
};

/** Colour is off when output is piped, so the report stays readable in a file. */
export function colours(on: boolean) {
  if (on) return C;
  return Object.fromEntries(Object.keys(C).map((k) => [k, ""])) as typeof C;
}

function bar(pct: number, width = 22): string {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}
function padStart(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}
function wrap(s: string, width: number, indent: string): string {
  const out: string[] = [];
  let line = "";
  for (const w of s.split(/\s+/)) {
    if ((line + " " + w).trim().length > width) {
      out.push(indent + line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) out.push(indent + line.trim());
  return out.join("\n");
}

export function renderReport(r: Report, opts: { colour: boolean; verbose: boolean }): string {
  const c = colours(opts.colour);
  const out: string[] = [];
  const slug = `${r.owner}/${r.repo}`;
  const bad = r.score < 55;

  out.push("");
  out.push(`  ${c.bold}${slug}${c.reset}   ${bad ? c.red : ""}${c.bold}${r.score}/100  ${r.grade}${c.reset}`);
  out.push(`  ${c.grey}${[r.language, `${r.fileCount.toLocaleString()} files`].filter(Boolean).join(" · ")}${c.reset}`);
  out.push("");

  if (!r.isSoftware) {
    out.push(`  ${c.red}Not scored as software:${c.reset} ${r.shapeReason}`);
    out.push("");
  }

  for (const cat of r.categories) {
    const pct = cat.max ? Math.round((cat.score / cat.max) * 100) : 0;
    const failing = pct < 55;
    const colour = failing ? c.red : "";
    out.push(
      `  ${colour}${pad(cat.label, 18)}${c.reset} ${colour}${bar(pct)}${c.reset} ` +
        `${c.grey}${padStart(`${cat.score}/${cat.max}`, 7)}${c.reset}  ${colour}${letterFor(pct)}${c.reset}`,
    );

    if (opts.verbose) {
      for (const chk of cat.checks) {
        const mark = chk.na ? `${c.grey}–` : chk.score === chk.max ? "✓" : `${c.red}✗`;
        out.push(`      ${mark} ${pad(chk.label, 30)}${c.reset} ${c.grey}${chk.na ? "n/a" : `${chk.score}/${chk.max}`}${c.reset}`);
        if (!chk.na && chk.score < chk.max) out.push(`${c.grey}${wrap(chk.verdict, 62, "        ")}${c.reset}`);
      }
      out.push("");
    }
  }

  if (r.topFixes.length) {
    out.push("");
    out.push(`  ${c.bold}Fix these first${c.reset}`);
    r.topFixes.slice(0, 3).forEach((f, i) => {
      out.push(`  ${c.red}${i + 1}.${c.reset} ${c.bold}${f.label}${c.reset}`);
      out.push(`${c.grey}${wrap(f.fix ?? "", 66, "     ")}${c.reset}`);
    });
  }

  out.push("");
  return out.join("\n");
}
