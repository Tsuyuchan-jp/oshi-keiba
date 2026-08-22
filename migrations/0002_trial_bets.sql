-- 試運転: 賭式・買い目。既存単勝票は win に移行

ALTER TABLE bets ADD COLUMN kind TEXT NOT NULL DEFAULT 'win';
ALTER TABLE bets ADD COLUMN selection_key TEXT;
ALTER TABLE bets ADD COLUMN horse_1 TEXT;
ALTER TABLE bets ADD COLUMN horse_2 TEXT;
ALTER TABLE bets ADD COLUMN horse_3 TEXT;

UPDATE bets
SET
  kind = 'win',
  selection_key = horse_id,
  horse_1 = horse_id
WHERE selection_key IS NULL;

CREATE INDEX IF NOT EXISTS idx_bets_event_kind ON bets(event_id, kind, selection_key);
