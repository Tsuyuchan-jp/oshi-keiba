import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSelection, type BetKind } from "./bets.ts";
import { buildBoard } from "./storeBoard.ts";
import type { BetRow, EventRow, HorseRow } from "./storeTypes.ts";
import { venueOddsResponse } from "./venueOdds.ts";

function event(status: EventRow["status"] = "setup", enabledKinds = "win,umaren,umatan,sanrenpuku,sanrentan"): EventRow {
  return {
    id: "event-1",
    title: "テスト開催",
    status,
    grant_g: 3000,
    bet_unit: 100,
    seed_pool_s: 80000,
    pull_e: 100000,
    takeout_d: 0.2,
    w_time_floor: 0.8,
    w_time_exp: 1,
    voting_opened_at: null,
    voting_closes_at: null,
    closed_at: status === "closed" ? 3000 : null,
    published_at: null,
    payouts_applied: 0,
    created_at: 1,
    enabled_kinds: enabledKinds,
    is_current: 1,
    score_setup: null,
    paddock_comments_enabled: 0,
  };
}

function horses(strengths: number[]): HorseRow[] {
  const ids = ["z-horse", "a-horse", "m-horse", "b-horse"];
  return strengths.map((strength, index) => ({
    id: ids[index]!,
    event_id: "event-1",
    name: `ウマ娘${index + 1}`,
    uma_name: `ウマ娘${index + 1}`,
    runner_name: `トレーナー${index + 1}`,
    shot_key: null,
    chara_id: null,
    dress_id: null,
    strength,
    score_input: null,
    seed_source: "manual",
    scratched: 0,
    finish_place: null,
    sort_order: index + 1,
  }));
}

function bet(
  id: string,
  kind: Exclude<BetKind, "win">,
  ids: string[],
  amount: number,
  createdAt: number,
  refunded = 0,
): BetRow {
  const selection = normalizeSelection(kind, ids);
  return {
    id,
    event_id: "event-1",
    user_id: "user-1",
    horse_id: selection.horse_1,
    kind,
    ...selection,
    amount,
    refunded,
    created_at: createdAt,
  };
}

test("順不同は馬番順の全組、順序ありは逆順を別買い目としてSeed参考オッズを返す", () => {
  const board = buildBoard(event(), horses([100, 50, 10]), [], 1000);
  const umaren = venueOddsResponse(board, "umaren");
  assert.equal(umaren.view, "umaren");
  assert.deepEqual(umaren.items.map((item) => item.label), ["1-2", "1-3", "2-3"]);
  assert.ok(umaren.items.every((item) => item.odds != null));

  const ordered = venueOddsResponse(board, "ordered");
  assert.equal(ordered.view, "ordered");
  const umatan = ordered.markets.find((market) => market.kind === "umatan")!;
  assert.equal(umatan.popular.length, 6);
  const forward = umatan.popular.find((item) => item.label === "1→2")!;
  const reverse = umatan.popular.find((item) => item.label === "2→1")!;
  assert.notEqual(forward.key, reverse.key);
  assert.notEqual(forward.odds, reverse.odds);
});

test("締切後は連勝Seedを混ぜず実票だけの確定配当を返す", () => {
  const hs = horses([100, 50, 10]);
  const bets = [
    bet("b1", "umaren", [hs[0]!.id, hs[1]!.id], 100, 1000),
    bet("b2", "umaren", [hs[0]!.id, hs[2]!.id], 300, 2000),
  ];
  const board = buildBoard(event("closed"), hs, bets, 3000);
  const response = venueOddsResponse(board, "umaren");
  assert.equal(response.view, "umaren");
  assert.equal(response.items.find((item) => item.label === "1-2")!.odds, 3.2);
  assert.equal(response.items.find((item) => item.label === "2-3")!.odds, null);
  const pool = board.pools.find((item) => item.kind === "umaren")!;
  assert.equal(response.items.find((item) => item.label === "1-3")!.odds, pool.combos.find((item) => item.real === 300)!.odds);
});

test("無効賭式はタブ用の空応答として残す", () => {
  const board = buildBoard(event("setup", "win,umaren"), horses([10, 9, 8]), [], 1000);
  const trio = venueOddsResponse(board, "sanrenpuku", 1);
  assert.equal(trio.view, "sanrenpuku");
  assert.equal(trio.enabled, false);
  assert.deepEqual(trio.items, []);
  const ordered = venueOddsResponse(board, "ordered");
  assert.equal(ordered.view, "ordered");
  assert.ok(ordered.markets.every((market) => !market.enabled));
});

test("直近投票は同じ買い目を集約し、返還票を除いた最終時刻順にする", () => {
  const hs = horses([10, 9, 8]);
  const bets = [
    bet("b1", "umatan", [hs[0]!.id, hs[1]!.id], 100, 1000),
    bet("b2", "umatan", [hs[1]!.id, hs[0]!.id], 100, 1500),
    bet("b3", "umatan", [hs[0]!.id, hs[1]!.id], 100, 2000),
    bet("b4", "umatan", [hs[1]!.id, hs[0]!.id], 100, 3000, 1),
  ];
  const board = buildBoard(event("voting"), hs, bets, 2500);
  const response = venueOddsResponse(board, "ordered");
  assert.equal(response.view, "ordered");
  const market = response.markets.find((item) => item.kind === "umatan")!;
  assert.deepEqual(market.recent.map((item) => item.label), ["1→2", "2→1"]);
  assert.equal(board.pools.find((item) => item.kind === "umatan")!.combos.find((item) => item.real === 200)!.lastBetAt, 2000);
});

test("同倍率の人気順は買い目の馬番順で固定する", () => {
  const board = buildBoard(event(), horses([10, 10, 10]), [], 1000);
  const response = venueOddsResponse(board, "ordered");
  assert.equal(response.view, "ordered");
  const market = response.markets.find((item) => item.kind === "umatan")!;
  assert.deepEqual(market.popular.map((item) => item.label), ["1→2", "1→3", "2→1", "2→3", "3→1", "3→2"]);
});

test("3連複は選択した軸を含む組だけを返す", () => {
  const board = buildBoard(event(), horses([10, 9, 8, 7]), [], 1000);
  const axis1 = venueOddsResponse(board, "sanrenpuku", 1);
  const axis3 = venueOddsResponse(board, "sanrenpuku", 3);
  assert.equal(axis1.view, "sanrenpuku");
  assert.equal(axis3.view, "sanrenpuku");
  assert.equal(axis1.items.length, 3);
  assert.equal(axis3.items.length, 3);
  assert.ok(axis1.items.every((item) => item.numbers.includes(1)));
  assert.ok(axis3.items.every((item) => item.numbers.includes(3)));
  assert.notDeepEqual(axis1.items.map((item) => item.label), axis3.items.map((item) => item.label));
});
