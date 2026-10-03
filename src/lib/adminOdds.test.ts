import assert from "node:assert/strict";
import test from "node:test";
import { adminOddsPage } from "./adminUi.ts";
import { exoticReferenceOdds } from "./odds.ts";
import { formatOddsWithUnit } from "./ui.ts";
import type { Board, EventRow, HorseBoard, KindPool } from "./storeTypes.ts";

function event(status: EventRow["status"]): EventRow {
  return {
    id: "e1",
    title: "見比べ",
    status,
    grant_g: 3000,
    bet_unit: 100,
    seed_pool_s: 80_000,
    pull_e: 100_000,
    takeout_d: 0.2,
    w_time_floor: 0.8,
    w_time_exp: 1,
    voting_opened_at: 1,
    voting_closes_at: 2,
    closed_at: null,
    published_at: null,
    payouts_applied: 0,
    created_at: 0,
    enabled_kinds: "win,umaren,umatan,sanrenpuku,sanrentan",
    is_current: 1,
    score_setup: null,
    paddock_comments_enabled: 0,
  };
}

function horse(id: string, number: number, real: number, referenceOdds: number | null, confirmedOdds: number | null): HorseBoard {
  return {
    horse: {
      id,
      event_id: "e1",
      name: id,
      uma_name: id,
      runner_name: "",
      shot_key: null,
      chara_id: null,
      dress_id: null,
      strength: 100,
      score_input: null,
      seed_source: "manual",
      scratched: 0,
      finish_place: null,
      sort_order: number,
    },
    number,
    real,
    imputed: 0,
    seed: 40_000,
    display: 40_000,
    referenceOdds,
    confirmedOdds,
  };
}

function pool(kind: KindPool["kind"], combos: KindPool["combos"], realTotal: number): KindPool {
  return { kind, realTotal, combos, winningKey: null, voidSpecial: null };
}

function board(): Board {
  return {
    event: event("voting"),
    wTime: 1,
    wVolume: 1,
    w: 1,
    realTotal: 400,
    exoticTotal: 300,
    tv: 700,
    seedTotal: 80_000,
    displayTotal: 80_000,
    horses: [
      horse("一番", 1, 100, 4.2, 3.2),
      horse("無投票", 2, 0, 8.0, null),
    ],
    pools: [
      pool("win", [], 400),
      pool("umaren", [{
        selection_key: "a-b",
        horse_1: "一番",
        horse_2: "無投票",
        horse_3: null,
        real: 300,
        odds: 0.8,
        lastBetAt: 1,
      }], 300),
      pool("umatan", [], 0),
      pool("sanrenpuku", [], 0),
      pool("sanrentan", [], 0),
    ],
  };
}

test("投票中のオッズタブは単勝を全頭、連勝を実票のある買い目だけ並べる", () => {
  const html = adminOddsPage(board());
  const win = html.slice(html.indexOf("odds-panel-win"), html.indexOf("odds-panel-q"));
  assert.match(win, /<th class="num">参考<\/th><th class="num">実票<\/th>/);
  assert.match(win, /一番/);
  assert.match(win, /4\.2倍/);
  assert.match(win, /3\.2倍/);
  assert.match(win, /無投票<\/td><td><\/td><td class="num">8\.0倍<\/td><td class="num">—<\/td>/);

  const umaren = html.slice(html.indexOf("odds-panel-q"), html.indexOf("odds-panel-e"));
  const reference = exoticReferenceOdds({
    kind: "umaren",
    strengths: [100, 100],
    selection: [0, 1],
    seedPool: 80_000,
    timeWeight: 1,
    realTotal: 300,
    selectionReal: 300,
    takeoutD: 0.2,
  });
  assert.match(umaren, /1-2/);
  assert.match(umaren, new RegExp(formatOddsWithUnit(reference).replace(".", "\\.")));
  assert.match(umaren, /0\.8倍/);
  assert.match(html, /odds-panel-t[\s\S]*実票のある買い目はありません/);
});

test("締切後のオッズタブは確定配当の1列に戻す", () => {
  const closed = board();
  closed.event = event("closed");
  const html = adminOddsPage(closed);
  const win = html.slice(html.indexOf("odds-panel-win"), html.indexOf("odds-panel-q"));
  assert.match(win, /単勝 · 確定/);
  assert.match(win, /無投票/);
  assert.doesNotMatch(win, /<th class="num">実票<\/th>/);
});
