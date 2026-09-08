-- 開催後のオッズ分析用。個人別の投票内容ではなく、その時点の集計板を残す。
CREATE TABLE analysis_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  cause TEXT NOT NULL,
  seed_pool_s REAL NOT NULL,
  pull_e REAL NOT NULL,
  takeout_d REAL NOT NULL,
  w_time_floor REAL NOT NULL,
  w_time_exp REAL NOT NULL,
  lambda REAL NOT NULL,
  w_time REAL NOT NULL,
  w_volume REAL NOT NULL,
  w REAL NOT NULL,
  win_real_total INTEGER NOT NULL,
  exotic_real_total INTEGER NOT NULL,
  tv INTEGER NOT NULL,
  joined_count INTEGER NOT NULL,
  bettor_count INTEGER NOT NULL,
  active_bet_count INTEGER NOT NULL,
  live_horse_count INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_snapshots_event_time
  ON analysis_snapshots(event_id, captured_at, id);

CREATE TABLE analysis_snapshot_odds (
  snapshot_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  selection_key TEXT NOT NULL,
  selection_label TEXT NOT NULL,
  horse_1 TEXT NOT NULL,
  horse_2 TEXT,
  horse_3 TEXT,
  real INTEGER NOT NULL,
  shown_odds REAL,
  seed REAL,
  imputed REAL,
  display REAL,
  is_scratched INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (snapshot_id, kind, selection_key),
  FOREIGN KEY (snapshot_id) REFERENCES analysis_snapshots(id) ON DELETE CASCADE
);
