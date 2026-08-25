-- ウマ娘名と出走者を分け、スクショは R2 キーだけ持つ

ALTER TABLE horses ADD COLUMN uma_name TEXT NOT NULL DEFAULT '';
ALTER TABLE horses ADD COLUMN runner_name TEXT NOT NULL DEFAULT '';
ALTER TABLE horses ADD COLUMN shot_key TEXT;
