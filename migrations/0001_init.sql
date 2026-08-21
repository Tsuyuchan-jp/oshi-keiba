-- 手土産 MVP: 出走・ユーザー・投票・イベント状態（共有 D1）

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  grant_g INTEGER NOT NULL,
  bet_unit INTEGER NOT NULL,
  seed_pool_s REAL NOT NULL,
  pull_e REAL NOT NULL,
  takeout_d REAL NOT NULL,
  w_time_floor REAL NOT NULL,
  w_time_exp REAL NOT NULL,
  voting_opened_at INTEGER,
  voting_closes_at INTEGER,
  closed_at INTEGER,
  published_at INTEGER,
  payouts_applied INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE horses (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  strength REAL NOT NULL,
  seed_source TEXT NOT NULL DEFAULT 'manual',
  scratched INTEGER NOT NULL DEFAULT 0,
  finish_place INTEGER,
  sort_order INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX idx_horses_event ON horses(event_id, sort_order);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  balance INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE bets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  horse_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  refunded INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (horse_id) REFERENCES horses(id)
);

CREATE INDEX idx_bets_event_horse ON bets(event_id, horse_id);
CREATE INDEX idx_bets_user ON bets(event_id, user_id);

CREATE TABLE grants (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  bet_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
