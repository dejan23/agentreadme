-- Store the full report so D1 can serve a page without calling GitHub at all.
-- Without this, every distinct repo request spends from a 5,000/hour token that
-- is shared by every visitor, which makes exhausting it trivial and cheap.
ALTER TABLE reports ADD COLUMN report_json TEXT;
CREATE INDEX IF NOT EXISTS idx_reports_graded ON reports(graded_at);
