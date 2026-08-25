-- One row per repository we have ever graded. The on-demand path writes here too,
-- so the leaderboard grows on its own as people use the site.
CREATE TABLE IF NOT EXISTS reports (
  slug              TEXT PRIMARY KEY,     -- "owner/repo", lowercased
  owner             TEXT NOT NULL,
  repo              TEXT NOT NULL,
  score             INTEGER NOT NULL,
  grade             TEXT NOT NULL,
  stars             INTEGER NOT NULL DEFAULT 0,
  language          TEXT,
  description       TEXT,
  -- Category scores are stored as percentages so they stay comparable across
  -- repos, since not-applicable checks change the denominator per repo.
  pct_instructions  INTEGER NOT NULL DEFAULT 0,
  pct_setup         INTEGER NOT NULL DEFAULT 0,
  pct_verification  INTEGER NOT NULL DEFAULT 0,
  pct_context       INTEGER NOT NULL DEFAULT 0,
  pct_navigation    INTEGER NOT NULL DEFAULT 0,
  has_agents_md     INTEGER NOT NULL DEFAULT 0,
  has_any_agent_doc INTEGER NOT NULL DEFAULT 0,
  has_test_command  INTEGER NOT NULL DEFAULT 0,
  file_count        INTEGER NOT NULL DEFAULT 0,
  graded_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_score    ON reports(score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_stars    ON reports(stars DESC);
CREATE INDEX IF NOT EXISTS idx_reports_language ON reports(language);

-- Awesome-lists, books, and tutorial repos are graded but excluded from the
-- leaderboard, since "can an agent install and test this" is meaningless there.
ALTER TABLE reports ADD COLUMN is_software INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_reports_software ON reports(is_software, stars DESC);
