/**
 * Pre-renders Open Graph cards to PNG.
 *
 * Rasterising costs 50-200ms of CPU and a Worker on the free plan is capped at
 * 10ms per request, so these cannot be produced on demand. They are rendered
 * here and served as static files from R2.
 *
 *   bun run scripts/og.ts            # every repo in seed/reports.jsonl
 *   bun run scripts/og.ts --limit 5  # a sample, while iterating
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import type { Report } from "../src/grade/types";
import { findingCard, repoCard } from "./og-card";

const OUT = "seed/og";
const args = process.argv.slice(2);
const flag = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d;
};
const LIMIT = flag("limit", Number.POSITIVE_INFINITY);

// Satori cannot parse variable fonts: opentype.js throws on the fvar table.
// assets/fonts holds static instances cut from the variable originals with
// fontTools, one file per weight we actually use.
const font = (name: string, file: string, weight: 400 | 600 | 700 | 800) => ({
  name,
  data: readFileSync(`assets/fonts/${file}`),
  weight,
  style: "normal" as const,
});

const fonts = [
  font("Archivo", "Archivo-400.ttf", 400),
  font("Archivo", "Archivo-600.ttf", 600),
  font("Archivo", "Archivo-800.ttf", 800),
  font("JetBrains Mono", "JetBrainsMono-400.ttf", 400),
  font("JetBrains Mono", "JetBrainsMono-700.ttf", 700),
];

let canOptimise: boolean | null = null;

/**
 * These cards are flat colour, so a 64-entry palette is lossless to the eye and
 * cuts each file from about 40KB to 16KB. Dithering is off deliberately: on flat
 * art it speckles the bar tracks instead of leaving them a clean grey.
 */
function optimise(file: string): void {
  if (canOptimise === false) return;
  try {
    execFileSync("magick", [file, "-strip", "+dither", "-colors", "64", `PNG8:${file}`], { stdio: "ignore" });
    canOptimise = true;
  } catch {
    if (canOptimise === null) console.log("  (ImageMagick not found, writing unoptimised PNGs)");
    canOptimise = false;
  }
}

async function png(element: unknown): Promise<Buffer> {
  const svg = await satori(element as any, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  if (!existsSync("seed/reports.jsonl")) {
    console.error("No seed/reports.jsonl. Run scripts/seed.ts first.");
    process.exit(1);
  }

  const rows = readFileSync("seed/reports.jsonl", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { slug: string; is_software: number; report_json?: string | null });

  const soft = rows.filter((r) => r.is_software);

  // The card every page that is not a single repository falls back to.
  const scores = soft.map((r) => (JSON.parse(r.report_json ?? "{}") as Report).score ?? 0).sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)] ?? 0;
  const withTest = soft.filter((r) => {
    const rep = JSON.parse(r.report_json ?? "{}") as Report;
    const c = rep.categories?.find((x) => x.id === "verification")?.checks.find((x) => x.id === "test-command");
    return c && c.score === c.max;
  }).length;
  const withMd = soft.filter((r) => {
    const rep = JSON.parse(r.report_json ?? "{}") as Report;
    const c = rep.categories?.find((x) => x.id === "instructions")?.checks.find((x) => x.id === "agents-file");
    return c && c.score === c.max;
  }).length;

  const defaultPath = `${OUT}/default.png`;
  writeFileSync(
    defaultPath,
    await png(
      findingCard({
        total: soft.length,
        median,
        noTest: Math.round(((soft.length - withTest) / soft.length) * 100),
        withMd: Math.round((withMd / soft.length) * 100),
      }),
    ),
  );
  optimise(defaultPath);
  console.log(`default.png  (median ${median}, ${soft.length} repos)`);

  let ok = 0;
  let skipped = 0;
  for (const r of soft.slice(0, LIMIT)) {
    if (!r.report_json) {
      skipped++;
      continue;
    }
    try {
      const report = JSON.parse(r.report_json) as Report;
      const name = `${report.owner}__${report.repo}`.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const out = `${OUT}/${name}.png`;
      writeFileSync(out, await png(repoCard(report)));
      optimise(out);
      ok++;
      if (ok % 100 === 0) console.log(`  ${ok} rendered`);
    } catch (e: any) {
      skipped++;
      console.log(`  FAILED ${r.slug}: ${e.message?.slice(0, 90)}`);
    }
  }
  console.log(`\nrendered ${ok}, skipped ${skipped}, written to ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
