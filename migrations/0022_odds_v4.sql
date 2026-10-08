-- 確定配当に Seed を残す。既存開催は odds-v3 のまま再計算しない。

ALTER TABLE events ADD COLUMN formula_version TEXT NOT NULL DEFAULT 'odds-v3';
ALTER TABLE events ADD COLUMN seed_umaren REAL NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN seed_umatan REAL NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN seed_sanrenpuku REAL NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN seed_sanrentan REAL NOT NULL DEFAULT 0;

-- 公開時の賭式ごとの当たり。全通りは保存しない。
CREATE TABLE event_kind_results (
  event_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  winning_key TEXT NOT NULL,
  odds REAL,
  payout_total INTEGER NOT NULL,
  PRIMARY KEY (event_id, kind),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 移管は負（新規発行）を許す。正のときだけ管理者残高へ足す。
CREATE TABLE event_settlements_v2 (
  event_id TEXT PRIMARY KEY,
  bet_total INTEGER NOT NULL CHECK (bet_total >= 0),
  payout_total INTEGER NOT NULL CHECK (payout_total >= 0),
  retained_amount INTEGER NOT NULL,
  settled_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('publish', 'backfill')),
  credited_at INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

INSERT INTO event_settlements_v2 (
  event_id, bet_total, payout_total, retained_amount, settled_at, source, credited_at
)
SELECT event_id, bet_total, payout_total, retained_amount, settled_at, source, credited_at
FROM event_settlements;

DROP TABLE event_settlements;
ALTER TABLE event_settlements_v2 RENAME TO event_settlements;
