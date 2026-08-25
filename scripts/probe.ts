/** Local sanity harness: grade real repos and print the scorecard. */
import { snapshot } from "../src/github";
import { grade } from "../src/grade";

import { readFileSync } from "node:fs";

const targets = process.argv.slice(2);
const token =
  process.env.GITHUB_TOKEN ??
  (() => {
    try {
      const m = readFileSync(".dev.vars", "utf8").match(/^\s*GITHUB_TOKEN\s*=\s*(.+)$/m);
      return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
    } catch {
      return undefined;
    }
  })();

for (const t of targets) {
  const [owner, repo] = t.split("/");
  try {
    const s = await snapshot(owner, repo, token);
    const r = grade(s);
    console.log(`\n${"=".repeat(62)}`);
    console.log(`${r.owner}/${r.repo}  ${r.score}/100  ${r.grade}   ★${r.stars.toLocaleString()}  ${r.language ?? "?"}  ${r.fileCount} files  [${r.isSoftware ? "SOFTWARE" : "excluded: " + r.shapeReason}]`);
    console.log("=".repeat(62));
    for (const c of r.categories) {
      console.log(`  ${c.label.padEnd(20)} ${String(c.score).padStart(3)}/${c.max}`);
      for (const ch of c.checks) {
        const mark = ch.score === ch.max ? "✓" : ch.score === 0 ? "✗" : "~";
        console.log(`    ${mark} ${ch.label.padEnd(30)} ${ch.score}/${ch.max}  ${ch.verdict}`);
      }
    }
    console.log(`  TOP FIXES: ${r.topFixes.map((f) => f.id).join(", ")}`);
  } catch (e: any) {
    console.log(`\n${t}: ERROR ${e.message}`);
  }
}
