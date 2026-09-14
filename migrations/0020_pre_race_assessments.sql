-- 運営が投票開始前に残す事前評価。順位・メモはどちらも任意。
CREATE TABLE pre_race_assessments (
  event_id TEXT NOT NULL,
  horse_id TEXT NOT NULL,
  rank INTEGER,
  memo TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, horse_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (horse_id) REFERENCES horses(id) ON DELETE CASCADE
);

CREATE INDEX idx_pre_race_assessments_event_rank
  ON pre_race_assessments(event_id, rank, updated_at);

-- 投票開始時点の評価内容と評価式。投票中以降はこの記録を表示する。
CREATE TABLE pre_race_assessment_snapshots (
  event_id TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  formula_version TEXT NOT NULL,
  formula_summary TEXT NOT NULL,
  assessments_json TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
