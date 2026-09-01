-- P0-02: メンバー操作の再送を一度だけ確定するための記録

CREATE TABLE member_operations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bet', 'redo')),
  request_hash TEXT NOT NULL,
  result_amount INTEGER NOT NULL,
  bet_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_member_operations_event_user
  ON member_operations(event_id, user_id, created_at);

ALTER TABLE bets ADD COLUMN operation_id TEXT;
CREATE UNIQUE INDEX idx_bets_operation_id
  ON bets(operation_id) WHERE operation_id IS NOT NULL;

ALTER TABLE payouts ADD COLUMN operation_id TEXT;
CREATE UNIQUE INDEX idx_payouts_operation_id
  ON payouts(operation_id, bet_id) WHERE operation_id IS NOT NULL;
