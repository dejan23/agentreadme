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
}

/** Repos below this are graded and stored, but kept off the leaderboard. */
export const LEADERBOARD_MIN_STARS = 1000;

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
  };
}

const UPSERT = `INSERT INTO reports (
  slug, owner, repo, score, grade, stars, language, description,
  pct_instructions, pct_setup, pct_verification, pct_context, pct_navigation,
  has_agents_md, has_any_agent_doc, has_test_command, file_count, is_software, graded_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(slug) DO UPDATE SET
  score=excluded.score, grade=excluded.grade, stars=excluded.stars,
  language=excluded.language, description=excluded.description,
  pct_instructions=excluded.pct_instructions, pct_setup=excluded.pct_setup,
  pct_verification=excluded.pct_verification, pct_context=excluded.pct_context,
  pct_navigation=excluded.pct_navigation, has_agents_md=excluded.has_agents_md,
  has_any_agent_doc=excluded.has_any_agent_doc, has_test_command=excluded.has_test_command,
  file_count=excluded.file_count, is_software=excluded.is_software,
  graded_at=excluded.graded_at`;

export function upsertValues(r: Row): unknown[] {
  return [
    r.slug, r.owner, r.repo, r.score, r.grade, r.stars, r.language, r.description,
    r.pct_instructions, r.pct_setup, r.pct_verification, r.pct_context, r.pct_navigation,
    r.has_agents_md, r.has_any_agent_doc, r.has_test_command, r.file_count, r.is_software, r.graded_at,
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
