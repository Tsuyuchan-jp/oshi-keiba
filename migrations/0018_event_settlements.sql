-- 場の会計: 開催ごとの確定精算と管理者（場）残高

CREATE TABLE event_settlements (
  event_id TEXT PRIMARY KEY,
  bet_total INTEGER NOT NULL CHECK (bet_total >= 0),
  payout_total INTEGER NOT NULL CHECK (payout_total >= 0),
  retained_amount INTEGER NOT NULL CHECK (retained_amount >= 0),
  settled_at INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('publish', 'backfill')),
  credited_at INTEGER,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 既に公開済みの開催（本番の第1回を含む）を、実際の票と払戻から一度だけ精算する。
INSERT INTO event_settlements (
  event_id, bet_total, payout_total, retained_amount, settled_at, source, credited_at
)
SELECT
  e.id,
  COALESCE((SELECT SUM(b.amount) FROM bets b WHERE b.event_id = e.id), 0),
  COALESCE((SELECT SUM(p.amount) FROM payouts p WHERE p.event_id = e.id), 0),
  COALESCE((SELECT SUM(b.amount) FROM bets b WHERE b.event_id = e.id), 0)
    - COALESCE((SELECT SUM(p.amount) FROM payouts p WHERE p.event_id = e.id), 0),
  COALESCE(e.published_at, e.created_at),
  'backfill',
  unixepoch() * 1000
FROM events e
WHERE e.status = 'published' AND e.payouts_applied = 1;

UPDATE users
SET balance = balance + COALESCE((
  SELECT SUM(retained_amount)
  FROM event_settlements
  WHERE source = 'backfill'
), 0)
WHERE id = '9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44' AND role = 'admin';

