-- 戦略例外スキル（グローバル）。U-tools 有効リストとは別レーンで点数を持つ

CREATE TABLE strategic_skills (
  skill_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  points REAL NOT NULL DEFAULT 1,
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE strategic_skill_dismissed (
  skill_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT INTO strategic_skills (skill_id, name, points, memo, created_at) VALUES
  (200431, 'コンセントレーション', 1, '金だが+2なし', datetime('now')),
  (200452, 'ポジションセンス', 1, '', datetime('now')),
  (201262, '危険回避', 1, '', datetime('now')),
  (210052, 'アオハル点火・賢', 1, '', datetime('now'));
