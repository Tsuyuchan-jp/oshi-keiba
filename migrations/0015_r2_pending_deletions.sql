-- Undo 中に消した画像を復元できるよう、R2 削除は一度保留する
CREATE TABLE r2_pending_deletions (
  object_key TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
