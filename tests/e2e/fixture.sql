DELETE FROM event_kind_results;
DELETE FROM event_settlements;
DELETE FROM member_operations;
DELETE FROM payouts;
DELETE FROM bets;
DELETE FROM grants;
DELETE FROM horses;
DELETE FROM events;
DELETE FROM users WHERE role = 'member';
UPDATE users SET balance = 0 WHERE role = 'admin';

INSERT INTO events (
  id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
  w_time_floor, w_time_exp, voting_opened_at, voting_closes_at, closed_at,
  published_at, payouts_applied, created_at, enabled_kinds, is_current, score_setup
) VALUES (
  'e2e-event', 'E2E開催', 'voting', 3000, 100, 500, 1000, 0.2,
  0.1, 1.5, 1893456000000, 4102444800000, NULL,
  NULL, 0, 1893456000000, 'win,umaren,umatan,sanrenpuku,sanrentan', 1,
  '{"conditions":{"courseKey":"10606","weather":1,"groundCondition":1,"season":3},"requirements":{"speedCap":1200,"staminaNoTempt":600,"staminaWithTempt":800,"staminaRace":false,"power":700,"guts":400,"wisdom":600,"staminaByStyle":{"runner":{"noTempt":600,"withTempt":800},"leader":{"noTempt":600,"withTempt":800},"betweener":{"noTempt":600,"withTempt":800},"chaser":{"noTempt":600,"withTempt":800}}},"staminaRaceSelected":true,"staminaSurplusSelected":true}'
);

INSERT INTO horses (
  id, event_id, name, uma_name, runner_name, chara_id, dress_id, strength,
  score_input, seed_source, scratched, finish_place, sort_order, created_at,
  shot_key, paddock_comment, trainer_icon_key
) VALUES
  ('e2e-horse-1', 'e2e-event', 'スペシャルウィーク（Alice）', 'スペシャルウィーク', 'Alice', NULL, NULL, 30, '{"stats":{"speed":1200,"stamina":800,"power":700,"guts":500,"wisdom":600},"aptitudes":{"turf":"A","dirt":"G","short":"G","mile":"A","medium":"A","long":"B","nige":"A","senkou":"A","sashi":"A","oikomi":"B"},"skillNames":[],"skillIds":[],"styleKey":"runner"}', 'manual', 0, NULL, 1, 1893456000000, NULL, '先頭を目指します', NULL),
  ('e2e-horse-2', 'e2e-event', 'サイレンススズカ（Bob）', 'サイレンススズカ', 'Bob', NULL, NULL, 20, '{"stats":{"speed":1150,"stamina":780,"power":720,"guts":500,"wisdom":650},"aptitudes":{"turf":"A","dirt":"G","short":"B","mile":"A","medium":"A","long":"B","nige":"A","senkou":"A","sashi":"B","oikomi":"G"},"skillNames":[],"skillIds":[],"styleKey":"leader"}', 'manual', 0, NULL, 2, 1893456000001, NULL, '逃げ切ります', NULL),
  ('e2e-horse-3', 'e2e-event', 'ゴールドシップ（Carol）', 'ゴールドシップ', 'Carol', NULL, NULL, 10, '{"stats":{"speed":1100,"stamina":900,"power":750,"guts":600,"wisdom":550},"aptitudes":{"turf":"A","dirt":"B","short":"G","mile":"B","medium":"A","long":"A","nige":"G","senkou":"B","sashi":"A","oikomi":"A"},"skillNames":[],"skillIds":[],"styleKey":"chaser"}', 'manual', 0, NULL, 3, 1893456000002, NULL, '楽しみます', NULL);
