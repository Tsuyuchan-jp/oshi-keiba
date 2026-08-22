-- 試運転: 有効な賭式（単勝は常に含む。初期は全部）

ALTER TABLE events ADD COLUMN enabled_kinds TEXT NOT NULL DEFAULT 'win,umaren,umatan,sanrenpuku,sanrentan';
