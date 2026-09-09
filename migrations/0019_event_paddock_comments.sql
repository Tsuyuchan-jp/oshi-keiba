-- 開催ごとのパドック意気込みコメント表示。初期値は使わない。
ALTER TABLE events ADD COLUMN paddock_comments_enabled INTEGER NOT NULL DEFAULT 0;
