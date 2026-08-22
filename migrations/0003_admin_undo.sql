-- 試運転: 管理者操作の直前スナップショット（1件だけ）

CREATE TABLE admin_undo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  action_label TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
