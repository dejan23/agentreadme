/**
 * Grades the most-starred public repositories and writes the results as SQL
 * for `wrangler d1 execute`.
 *
 *   GITHUB_TOKEN=... bun run scripts/seed.ts --limit 1000
 *
 * Results stream to seed/reports.jsonl as they finish, and a rerun skips
 * anything already in that file, so an interrupted crawl resumes for free.
 */
import { mkdirSync, appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { snapshot } from "../src/github";
import { grade } from "../src/grade";
import { toRow, upsertValues, type Row } from "../src/db";

const TOKEN = process.env.GITHUB_TOKEN;
const OUT_DIR = "seed";
const JSONL = `${OUT_DIR}/reports.jsonl`;
const SQL = `${OUT_DIR}/seed.sql`;

const args = process.argv.slice(2);
const flag = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};
const LIMIT = flag("limit", 1000);
const CONCURRENCY = flag("concurrency", 6);
const MIN_STARS = flag("min-stars", 1000);

const UA = { "User-Agent": "agentreadme-seed (+https://agentreadme.com)" };
const authHeaders = TOKEN ? { ...UA, Authorization: `Bearer ${TOKEN}` } : UA;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Waits out a rate limit rather than failing the crawl. */
async function ghJson(url: string, attempt = 0): Promise<any> {
  const res = await fetch(url, { headers: authHeaders });
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const waitMs = Math.max(2000, Math.min(reset - Date.now() + 1500, 15 * 60_000));
    if (attempt > 5) throw new Error(`rate limited repeatedly on ${url}`);
    console.log(`  rate limited, waiting ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs);
    return ghJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.json();
}

/**
 * GitHub search caps any single query at 1000 results, so walk descending star
 * ranges and page through each one to get past that ceiling.
 */
async function topRepos(limit: number): Promise<Array<{ owner: string; repo: string }>> {
  const out: Array<{ owner: string; repo: string }> = [];
  const seen = new Set<string>();
  let ceiling = 500_000;

  while (out.length < limit && ceiling > MIN_STARS) {
    let pageCount = 0;
    let lowest = ceiling;

    for (let page = 1; page <= 10 && out.length < limit; page++) {
      const q = `stars:${MIN_STARS}..${ceiling}`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100&page=${page}`;
      const j = await ghJson(url);
      const items = j.items ?? [];
      if (!items.length) break;

      for (const it of items) {
        const slug = it.full_name as string;
        if (seen.has(slug.toLowerCase())) continue;
        seen.add(slug.toLowerCase());
        const [owner, repo] = slug.split("/");
        out.push({ owner, repo });
        lowest = Math.min(lowest, it.stargazers_count ?? lowest);
        if (out.length >= limit) break;
      }
      pageCount++;
      await sleep(2100); // search API allows 30/min authenticated
    }

    if (pageCount === 0 || lowest >= ceiling) break;
    ceiling = lowest; // next window starts where this one ran out
    console.log(`  collected ${out.length}, next window tops out at ${ceiling} stars`);
  }
  return out.slice(0, limit);
}

function loadDone(): Map<string, Row> {
  const done = new Map<string, Row>();
  if (!existsSync(JSONL)) return done;
  for (const line of readFileSync(JSONL, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Row;
      done.set(row.slug, row);
    } catch {
      /* skip a half-written line from an interrupted run */
    }
  }
  return done;
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(Math.round(v));
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  if (!TOKEN) console.log("No GITHUB_TOKEN set. Expect 60 requests/hour and a very slow crawl.\n");

  const done = loadDone();
  console.log(`Resuming with ${done.size} repos already graded.`);

  console.log(`Collecting the top ${LIMIT} repos above ${MIN_STARS} stars...`);
  const targets = (await topRepos(LIMIT)).filter(
    (t) => !done.has(`${t.owner}/${t.repo}`.toLowerCase()),
  );
  console.log(`${targets.length} left to grade.\n`);

  let ok = 0;
  let failed = 0;
  let cursor = 0;

  async function worker(id: number) {
    while (cursor < targets.length) {
      const t = targets[cursor++];
      const n = cursor;

      // A rate limit mid-crawl should cost time, not coverage. Back off and retry
      // rather than dropping the repo from the dataset.
      for (let attempt = 0; ; attempt++) {
        try {
          const report = grade(await snapshot(t.owner, t.repo, TOKEN));
          const row = toRow(report);
          appendFileSync(JSONL, JSON.stringify(row) + "\n");
          done.set(row.slug, row);
          ok++;
          const tag = row.is_software ? "" : "  (excluded: not software)";
          console.log(`[${n}/${targets.length}] ${row.slug} ${row.score} ${row.grade}${tag}`);
          break;
        } catch (e: any) {
          const limited = /rate limit/i.test(e.message ?? "");
          if (limited && attempt < 6) {
            const wait = Math.min(60_000 * 2 ** attempt, 15 * 60_000);
            console.log(`  rate limited on ${t.owner}/${t.repo}, waiting ${Math.round(wait / 1000)}s`);
            await sleep(wait);
            continue;
          }
          failed++;
          console.log(`[${n}/${targets.length}] ${t.owner}/${t.repo} FAILED ${e.message}`);
          break;
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  // --- Emit SQL ---
  const rows = [...done.values()];
  const cols = [
    "slug", "owner", "repo", "score", "grade", "stars", "language", "description",
    "pct_instructions", "pct_setup", "pct_verification", "pct_context", "pct_navigation",
    "has_agents_md", "has_any_agent_doc", "has_test_command", "file_count", "is_software", "graded_at",
  ];
  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += 200) {
    const values = rows
      .slice(i, i + 200)
      .map((r) => `(${upsertValues(r).map(sqlLiteral).join(",")})`)
      .join(",\n");
    chunks.push(`INSERT OR REPLACE INTO reports (${cols.join(",")}) VALUES\n${values};`);
  }
  writeFileSync(SQL, chunks.join("\n\n") + "\n");

  // --- The launch numbers ---
  // Headline numbers describe real software only. Including awesome-lists would
  // make the median meaningless and the claim indefensible.
  const soft = rows.filter((r) => r.is_software);
  const scores = soft.map((r) => r.score).sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)] ?? 0;
  const pct = (n: number) => `${Math.round((n / soft.length) * 100)}%`;

  console.log(`\n${"=".repeat(56)}`);
  console.log(`graded ${ok}, failed ${failed}, total on file ${rows.length}`);
  console.log(`real software           ${soft.length}  (${rows.length - soft.length} lists/books/tutorials excluded)`);
  console.log(`median score          ${median}`);
  console.log(`mean score            ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}`);
  console.log(`have AGENTS.md        ${pct(soft.filter((r) => r.has_agents_md).length)}`);
  console.log(`have any agent doc    ${pct(soft.filter((r) => r.has_any_agent_doc).length)}`);
  console.log(`have a test command   ${pct(soft.filter((r) => r.has_test_command).length)}`);
  console.log(`scored below 50       ${pct(soft.filter((r) => r.score < 50).length)}`);
  console.log(`wrote ${SQL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
