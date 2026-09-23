-- 連勝参考オッズの分析材料と、容量上限を守るR2退避の記録。
ALTER TABLE analysis_snapshot_odds ADD COLUMN is_bet INTEGER NOT NULL DEFAULT 0;
ALTER TABLE analysis_snapshot_odds ADD COLUMN popular_rank INTEGER;
ALTER TABLE analysis_snapshots ADD COLUMN log_complete INTEGER NOT NULL DEFAULT 1;

CREATE TABLE analysis_snapshot_markets (
  snapshot_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  real_total INTEGER NOT NULL,
  pull_e REAL NOT NULL,
  seed_pool_s REAL NOT NULL,
  gamma REAL NOT NULL,
  strength_floor REAL NOT NULL,
  w_time REAL NOT NULL,
  w_volume REAL NOT NULL,
  w REAL NOT NULL,
  PRIMARY KEY (snapshot_id, kind),
  FOREIGN KEY (snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE
);

CREATE TABLE analysis_log_states (
  event_id TEXT PRIMARY KEY,
  active_uncompressed_bytes INTEGER NOT NULL DEFAULT 0,
  horse_csv_bytes INTEGER NOT NULL DEFAULT 0,
  archive_count INTEGER NOT NULL DEFAULT 0,
  archive_in_progress INTEGER NOT NULL DEFAULT 0,
  capture_paused INTEGER NOT NULL DEFAULT 0,
  skipped_snapshot_count INTEGER NOT NULL DEFAULT 0,
  limit_reached_at INTEGER,
  last_archived_at INTEGER,
  last_archive_error TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE analysis_log_archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  archived_at INTEGER NOT NULL,
  first_captured_at INTEGER NOT NULL,
  last_captured_at INTEGER NOT NULL,
  snapshot_count INTEGER NOT NULL,
  odds_row_count INTEGER NOT NULL,
  uncompressed_bytes INTEGER NOT NULL,
  formula_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  UNIQUE (event_id, part_number),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_log_archives_event_part
  ON analysis_log_archives(event_id, part_number);
