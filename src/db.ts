import type { Report } from "./grade/types";

export interface Row {
  slug: string;
  owner: string;
  repo: string;
  score: number;
  grade: string;
  stars: number;
  language: string | null;
  description: string | null;
  pct_instructions: number;
  pct_setup: number;
  pct_verification: number;
  pct_context: number;
  pct_navigation: number;
  has_agents_md: number;
  has_any_agent_doc: number;
  has_test_command: number;
  file_count: number;
  is_software: number;
  graded_at: string;
  /** The full Report as JSON, so a page can be served without calling GitHub. */
  report_json?: string | null;
}

/** Repos below this are graded and stored, but kept off the leaderboard. */
export const LEADERBOARD_MIN_STARS = 1000;

/**
 * Below this, a report is reachable but not submitted to search engines.
 *
 * Someone pasting their own repository is asking for a mark, not for a public
 * page about it in Google. Pushing obscure repos at search engines is also the
 * thin-content signal that would sink indexing for the pages that matter.
 * Lower than the leaderboard threshold, because a 200 star project is a real
 * public thing worth finding, while a 2 star one is somebody's weekend.
 */
export const INDEX_MIN_STARS = 100;

function pct(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

function checkPassed(r: Report, catId: string, checkId: string): number {
  const c = r.categories.find((x) => x.id === catId)?.checks.find((x) => x.id === checkId);
  return c && !c.na && c.score === c.max ? 1 : 0;
}

export function toRow(r: Report): Row {
  const cat = (id: string) => r.categories.find((c) => c.id === id);
  const instr = cat("instructions");
  const agentsFile = instr?.checks.find((c) => c.id === "agents-file");

  return {
    slug: `${r.owner}/${r.repo}`.toLowerCase(),
    owner: r.owner,
    repo: r.repo,
    score: r.score,
    grade: r.grade,
    stars: r.stars,
    language: r.language,
    description: r.description,
    pct_instructions: pct(instr?.score ?? 0, instr?.max ?? 0),
    pct_setup: pct(cat("setup")?.score ?? 0, cat("setup")?.max ?? 0),
    pct_verification: pct(cat("verification")?.score ?? 0, cat("verification")?.max ?? 0),
    pct_context: pct(cat("context")?.score ?? 0, cat("context")?.max ?? 0),
    pct_navigation: pct(cat("navigation")?.score ?? 0, cat("navigation")?.max ?? 0),
    // Full marks on the agent-file check means AGENTS.md specifically; partial
    // credit means some other tool-specific file was found instead.
    has_agents_md: agentsFile && agentsFile.score === agentsFile.max ? 1 : 0,
    has_any_agent_doc: agentsFile && agentsFile.score > 0 ? 1 : 0,
    has_test_command: checkPassed(r, "verification", "test-command"),
    file_count: r.fileCount,
    is_software: r.isSoftware ? 1 : 0,
    graded_at: r.gradedAt,
    report_json: JSON.stringify(r),
  };
}

const UPSERT = `INSERT INTO reports (
  slug, owner, repo, score, grade, stars, language, description,
  pct_instructions, pct_setup, pct_verification, pct_context, pct_navigation,
  has_agents_md, has_any_agent_doc, has_test_command, file_count, is_software, graded_at,
  report_json
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(slug) DO UPDATE SET
  score=excluded.score, grade=excluded.grade, stars=excluded.stars,
  language=excluded.language, description=excluded.description,
  pct_instructions=excluded.pct_instructions, pct_setup=excluded.pct_setup,
  pct_verification=excluded.pct_verification, pct_context=excluded.pct_context,
  pct_navigation=excluded.pct_navigation, has_agents_md=excluded.has_agents_md,
  has_any_agent_doc=excluded.has_any_agent_doc, has_test_command=excluded.has_test_command,
  file_count=excluded.file_count, is_software=excluded.is_software,
  graded_at=excluded.graded_at, report_json=excluded.report_json`;

export function upsertValues(r: Row): unknown[] {
  return [
    r.slug, r.owner, r.repo, r.score, r.grade, r.stars, r.language, r.description,
    r.pct_instructions, r.pct_setup, r.pct_verification, r.pct_context, r.pct_navigation,
    r.has_agents_md, r.has_any_agent_doc, r.has_test_command, r.file_count, r.is_software, r.graded_at,
    r.report_json ?? null,
  ];
}

export async function saveReport(db: D1Database, report: Report): Promise<void> {
  await db.prepare(UPSERT).bind(...(upsertValues(toRow(report)) as any[])).run();
}

export interface Stats {
  total: number;
  median: number;
  withAgentsMd: number;
  withAnyAgentDoc: number;
  withTestCommand: number;
}

export async function leaderboardStats(db: D1Database): Promise<Stats> {
  const min = LEADERBOARD_MIN_STARS;
  const agg = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(has_agents_md) AS a,
              SUM(has_any_agent_doc) AS b,
              SUM(has_test_command) AS c
       FROM reports WHERE stars >= ? AND is_software = 1`,
    )
    .bind(min)
    .first<{ total: number; a: number; b: number; c: number }>();

  const total = agg?.total ?? 0;
  // SQLite has no median, so take the middle row by offset.
  const mid = await db
    .prepare(`SELECT score FROM reports WHERE stars >= ? AND is_software = 1 ORDER BY score LIMIT 1 OFFSET ?`)
    .bind(min, Math.max(0, Math.floor(total / 2)))
    .first<{ score: number }>();

  return {
    total,
    median: mid?.score ?? 0,
    withAgentsMd: agg?.a ?? 0,
    withAnyAgentDoc: agg?.b ?? 0,
    withTestCommand: agg?.c ?? 0,
  };
}

export type Sort = "best" | "worst" | "popular";

export async function leaderboard(
  db: D1Database,
  opts: { sort: Sort; language?: string; limit?: number },
): Promise<Row[]> {
  const order =
    opts.sort === "worst" ? "score ASC, stars DESC" : opts.sort === "popular" ? "stars DESC" : "score DESC, stars DESC";
  const base = "stars >= ? AND is_software = 1";
  const where = opts.language ? `${base} AND language = ?` : base;
  const binds: unknown[] = opts.language
    ? [LEADERBOARD_MIN_STARS, opts.language]
    : [LEADERBOARD_MIN_STARS];
  const { results } = await db
    .prepare(`SELECT * FROM reports WHERE ${where} ORDER BY ${order} LIMIT ?`)
    .bind(...(binds as any[]), Math.min(opts.limit ?? 100, 250))
    .all<Row>();
  return results ?? [];
}

export async function languages(db: D1Database): Promise<Array<{ language: string; n: number }>> {
  const { results } = await db
    .prepare(
      `SELECT language, COUNT(*) AS n FROM reports
       WHERE stars >= ? AND is_software = 1 AND language IS NOT NULL
       GROUP BY language HAVING n >= 5 ORDER BY n DESC LIMIT 14`,
    )
    .bind(LEADERBOARD_MIN_STARS)
    .all<{ language: string; n: number }>();
  return results ?? [];
}

/**
 * Median score per language, for the homepage chart. SQLite has no median, so
 * take the middle row(s) per partition with a window function and average them,
 * which handles both odd and even counts.
 */
export async function languageMedians(
  db: D1Database,
  minSample = 15,
  limit = 10,
): Promise<Array<[string, number]>> {
  const { results } = await db
    .prepare(
      `SELECT language, CAST(ROUND(AVG(score)) AS INTEGER) AS m, MAX(n) AS cnt FROM (
         SELECT language, score,
                ROW_NUMBER() OVER (PARTITION BY language ORDER BY score) AS rn,
                COUNT(*)     OVER (PARTITION BY language)                AS n
         FROM reports
         WHERE stars >= ? AND is_software = 1 AND language IS NOT NULL
       )
       WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
       GROUP BY language
       HAVING cnt >= ?
       ORDER BY m DESC
       LIMIT ?`,
    )
    .bind(LEADERBOARD_MIN_STARS, minSample, limit)
    .all<{ language: string; m: number }>();
  return (results ?? []).map((r) => [r.language, r.m] as [string, number]);
}

/**
 * A previously stored report, with how old it is.
 *
 * This is the second cache layer and the main defence against someone burning
 * the shared GitHub token: a repo we have already marked costs zero API calls
 * to serve, and a stale copy is far better than an error when the token is
 * exhausted.
 */
export async function storedReport(
  db: D1Database,
  owner: string,
  repo: string,
): Promise<{ report: Report; ageMs: number } | null> {
  const row = await db
    .prepare(`SELECT report_json, graded_at FROM reports WHERE slug = ?`)
    .bind(`${owner}/${repo}`.toLowerCase())
    .first<{ report_json: string | null; graded_at: string }>();

  if (!row?.report_json) return null;
  try {
    const report = JSON.parse(row.report_json) as Report;
    const ageMs = Date.now() - Date.parse(row.graded_at);
    return { report, ageMs: Number.isFinite(ageMs) ? ageMs : Number.MAX_SAFE_INTEGER };
  } catch {
    return null;
  }
}

/** Every marked repository, for the sitemap. Cheap: two columns, no report body. */
export async function allSlugs(
  db: D1Database,
  limit = 45000,
): Promise<Array<{ slug: string; graded_at: string }>> {
  const { results } = await db
    .prepare(
      `SELECT slug, graded_at FROM reports
       WHERE is_software = 1 AND stars >= ?
       ORDER BY stars DESC
       LIMIT ?`,
    )
    .bind(INDEX_MIN_STARS, limit)
    .all<{ slug: string; graded_at: string }>();
  return results ?? [];
}

/** Other repos in the same language, to link repo pages to each other. */
export async function relatedRepos(
  db: D1Database,
  owner: string,
  repo: string,
  language: string | null,
  limit = 6,
): Promise<Row[]> {
  if (!language) return [];
  const { results } = await db
    .prepare(
      `SELECT * FROM reports
       WHERE language = ? AND is_software = 1 AND slug != ?
       ORDER BY stars DESC LIMIT ?`,
    )
    .bind(language, `${owner}/${repo}`.toLowerCase(), limit)
    .all<Row>();
  return results ?? [];
}
