-- P0-05: メンバーを利用停止にして、開催記録を残す

ALTER TABLE users ADD COLUMN deleted_at INTEGER;
