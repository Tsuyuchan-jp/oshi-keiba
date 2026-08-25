-- 開催条件とステ目標値（評価点用。JSON。未設定は NULL＝直置きのみ）

ALTER TABLE events ADD COLUMN score_setup TEXT;
