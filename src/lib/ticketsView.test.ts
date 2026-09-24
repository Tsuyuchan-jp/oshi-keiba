import assert from "node:assert/strict";
import test from "node:test";
import type { BetRow, Board } from "./store.ts";
import { buildMyTickets, ticketSummary } from "./ticketsView.ts";

function board(status: Board["event"]["status"]): Board {
  return {
    event: { id: "e", title: "記念レース", status, enabled_kinds: "win,umaren", is_current: 1 } as Board["event"],
    horses: [
      { number: 1, horse: { id: "h1", uma_name: "一番" }, confirmedOdds: 3.2 },
      { number: 2, horse: { id: "h2", uma_name: "二番" }, confirmedOdds: 5.4 },
    ] as Board["horses"],
    pools: [{ kind: "umaren", realTotal: 300, winningKey: "h1-h2", voidSpecial: false, combos: [{ selection_key: "h1-h2", horse_1: "h1", horse_2: "h2", horse_3: null, real: 300, odds: 1.8, lastBetAt: 2 }] }],
  } as Board;
}

const bets: BetRow[] = [
  { id: "b1", event_id: "e", user_id: "u", horse_id: "h1", kind: "win", selection_key: "h1", horse_1: "h1", horse_2: null, horse_3: null, amount: 100, refunded: 0, created_at: 1 },
  { id: "b2", event_id: "e", user_id: "u", horse_id: "h1", kind: "win", selection_key: "h1", horse_1: "h1", horse_2: null, horse_3: null, amount: 200, refunded: 0, created_at: 2 },
  { id: "b3", event_id: "e", user_id: "u", horse_id: "h2", kind: "win", selection_key: "h2", horse_1: "h2", horse_2: null, horse_3: null, amount: 100, refunded: 1, created_at: 3 },
];

test("同じ買い目を1枚へまとめ、やりなおし済みは除外する", () => {
  const tickets = buildMyTickets(board("voting"), bets, [{ bet_id: "b3", amount: 100, kind: "redo" }]);
  assert.equal(tickets.length, 1);
  assert.equal(tickets[0]?.amount, 300);
  assert.equal(tickets[0]?.purchaseCount, 2);
  assert.equal(tickets[0]?.result, "pending");
});

test("公開後の的中額と集計を返す", () => {
  const tickets = buildMyTickets(board("published"), bets.slice(0, 2), [
    { bet_id: "b1", amount: 320, kind: "win" },
    { bet_id: "b2", amount: 640, kind: "win" },
  ]);
  assert.equal(tickets[0]?.result, "hit");
  assert.equal(tickets[0]?.payoutAmount, 960);
  assert.equal(tickets[0]?.confirmedOdds, 3.2);
  assert.deepEqual(ticketSummary(tickets), { count: 1, amount: 300, hitCount: 1, payoutAmount: 960 });
});
