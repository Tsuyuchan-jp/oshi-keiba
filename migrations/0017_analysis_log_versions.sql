-- 分析CSVの解釈を開催間で混同しないための版情報。
ALTER TABLE analysis_snapshots ADD COLUMN formula_version TEXT NOT NULL DEFAULT 'odds-v2';
ALTER TABLE analysis_snapshots ADD COLUMN schema_version TEXT NOT NULL DEFAULT 'analysis-log-v1';

-- ログ保存の失敗は投票を失敗扱いにせず、管理者が後から確認する。
CREATE TABLE analysis_log_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT,
  occurred_at INTEGER NOT NULL,
  cause TEXT NOT NULL,
  message TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX idx_analysis_log_failures_event_time
  ON analysis_log_failures(event_id, occurred_at DESC, id DESC);
