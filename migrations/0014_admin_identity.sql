-- 管理者は表示名ではなく、この固定 UUID で識別する。
-- deploy 前に同じ値を ADMIN_USER_ID Secret に設定すること。
INSERT INTO users (id, display_name, role, balance, created_at)
VALUES (
  '9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44',
  '管理者（システム）',
  'admin',
  0,
  unixepoch() * 1000
)
ON CONFLICT(id) DO NOTHING;
