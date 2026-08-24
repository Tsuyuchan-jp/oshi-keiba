import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeSelection,
  parseEnabledKinds,
  serializeEnabledKinds,
  settleBet,
  winningKey,
} from "./bets.ts";
import {
  addImputed,
  allocateSeed,
  DEFAULTS,
  displayPool,
  IMPUTED_LAMBDA,
  parimutuelOdds,
  payoutAmount,
  referenceTv,
  specialPayoutAmount,
  wCombined,
  wTime,
  wVolume,
} from "./odds.ts";

test("有効賭式: 空は全部オン、単勝は外せない", () => {
  assert.deepEqual(parseEnabledKinds(null), [
    "win",
    "umaren",
    "umatan",
    "sanrenpuku",
    "sanrentan",
  ]);
  assert.deepEqual(parseEnabledKinds("umaren,sanrentan"), [
    "win",
    "umaren",
    "sanrentan",
  ]);
  assert.equal(
    serializeEnabledKinds(["sanrentan", "win", "umaren"]),
    "win,umaren,sanrentan",
  );
});

test("開催デフォルトは第2回案 B", () => {
  assert.equal(DEFAULTS.grantG, 3000);
  assert.equal(DEFAULTS.betUnit, 100);
  assert.equal(DEFAULTS.seedPoolS, 80000);
  assert.equal(DEFAULTS.pullE, 100000);
  assert.equal(DEFAULTS.wTimeFloor, 0.8);
  assert.equal(DEFAULTS.wTimeExp, 1);
  assert.equal(DEFAULTS.takeoutD, 0.2);
  assert.equal(IMPUTED_LAMBDA, 1);
});

test("Imputed: 馬連1:1 馬単2:1 3連複1:1:1 3連単3:2:1。λは額に掛ける", () => {
  const a = new Map<string, number>();
  addImputed("umaren", 600, "A", "B", null, 1, a);
  assert.equal(a.get("A"), 300);
  assert.equal(a.get("B"), 300);

  const b = new Map<string, number>();
  addImputed("umatan", 600, "A", "B", null, 1, b);
  assert.equal(b.get("A"), 400);
  assert.equal(b.get("B"), 200);

  const c = new Map<string, number>();
  addImputed("sanrenpuku", 600, "A", "B", "C", 1, c);
  assert.equal(c.get("A"), 200);
  assert.equal(c.get("B"), 200);
  assert.equal(c.get("C"), 200);

  const d = new Map<string, number>();
  addImputed("sanrentan", 600, "A", "B", "C", 1, d);
  assert.equal(d.get("A"), 300);
  assert.equal(d.get("B"), 200);
  assert.equal(d.get("C"), 100);

  const e = new Map<string, number>();
  addImputed("umaren", 600, "A", "B", null, 0.5, e);
  assert.equal(e.get("A"), 150);
  addImputed("win", 3000, "A", null, null, 1, e);
  assert.equal(e.get("A"), 150);
});

test("単勝参考の TV は単勝＋λ×連勝", () => {
  assert.equal(referenceTv(19800, 17800, 1), 37600);
  assert.equal(referenceTv(19800, 17800, 0.5), 19800 + 8900);
});

test("票量側: E の半分でだいたい半分、E で 0", () => {
  assert.equal(wVolume(0, 20000), 1);
  assert.equal(wVolume(10000, 20000), 0.5);
  assert.equal(wVolume(20000, 20000), 0);
  assert.equal(wVolume(30000, 20000), 0);
});

test("時間側: 終了時は下限で、時計だけでは 0 にしない", () => {
  const opened = 1_000_000;
  const closes = 1_000_000 + 3_600_000;
  const floor = 0.5;
  const start = wTime(opened, opened, closes, floor, 1);
  const mid = wTime(opened + 1_800_000, opened, closes, floor, 1);
  const end = wTime(closes, opened, closes, floor, 1);
  assert.ok(Math.abs(start - 1) < 1e-9);
  assert.ok(Math.abs(mid - 0.75) < 1e-9);
  assert.ok(Math.abs(end - 0.5) < 1e-9);
  assert.ok(end > 0);
});

test("時間側: 締切未設定なら減衰しない", () => {
  assert.equal(wTime(Date.now(), 1, null, 0.5, 1), 1);
});

test("合成 w: 票が十分なら 0、時間だけでは 0 にしない", () => {
  const timeOnly = wCombined(0.5, 1);
  const fullReal = wCombined(0.5, 0);
  assert.equal(timeOnly, 0.5);
  assert.equal(fullReal, 0);
});

test("Seed は Strength 比。確定配当は Real のみ", () => {
  const seeds = allocateSeed([25, 25, 25, 25], 20000);
  assert.deepEqual(seeds, [5000, 5000, 5000, 5000]);

  const w = 1;
  const reals = [700, 0, 0, 0];
  const displays = seeds.map((s, i) => displayPool(s, w, reals[i]));
  assert.equal(displayPool(1000, 0.5, 100, 50), 650);
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const refFav = parimutuelOdds(displays[0], displayTotal, 0.2);
  const realTotal = reals.reduce((a, b) => a + b, 0);
  const confirmedFav = parimutuelOdds(reals[0], realTotal, 0.2);
  const confirmedEmpty = parimutuelOdds(reals[1], realTotal, 0.2);

  assert.ok(refFav != null && refFav > 1);
  assert.ok(confirmedFav != null);
  assert.equal(confirmedFav, (700 * 0.8) / 700);
  assert.equal(confirmedEmpty, null);
  assert.notEqual(refFav, confirmedFav);
});

test("払戻は切り捨て。不成立は 0", () => {
  assert.equal(payoutAmount(700, 3.2), 2240);
  assert.equal(payoutAmount(100, 0), 0);
});

test("特払い B: 100→80、端数切り捨て", () => {
  assert.equal(specialPayoutAmount(100, 0.2), 80);
  assert.equal(specialPayoutAmount(150, 0.2), 120);
  assert.equal(specialPayoutAmount(101, 0.2), 80);
});

test("馬連・3連複はソート、同じ頭は拒否", () => {
  const u = normalizeSelection("umaren", ["b", "a"]);
  assert.equal(u.selection_key, "a-b");
  const s = normalizeSelection("sanrenpuku", ["c", "a", "b"]);
  assert.equal(s.selection_key, "a-b-c");
  const t = normalizeSelection("umatan", ["b", "a"]);
  assert.equal(t.selection_key, "b>a");
  assert.throws(() => normalizeSelection("umaren", ["a", "a"]));
});

test("当選キー: 着順から各賭式", () => {
  const horses = [
    { id: "h1", finish_place: 1, scratched: 0 },
    { id: "h2", finish_place: 2, scratched: 0 },
    { id: "h3", finish_place: 3, scratched: 0 },
  ];
  assert.equal(winningKey("win", horses), "h1");
  assert.equal(winningKey("umaren", horses), "h1-h2");
  assert.equal(winningKey("umatan", horses), "h1>h2");
  assert.equal(winningKey("sanrenpuku", horses), "h1-h2-h3");
  assert.equal(winningKey("sanrentan", horses), "h1>h2>h3");
});

test("清算行: 的中・はずれ・特払い・返還の収支", () => {
  assert.deepEqual(
    settleBet({
      amount: 100,
      refunded: false,
      status: "published",
      payout: { kind: "win", amount: 320 },
      comboOdds: 3.2,
      kindVoid: false,
    }),
    { result: "的中", odds: 3.2, move: 220 },
  );
  assert.equal(
    settleBet({
      amount: 500,
      refunded: false,
      status: "published",
      payout: null,
      comboOdds: 12.5,
      kindVoid: false,
    }).result,
    "はずれ",
  );
  assert.equal(
    settleBet({
      amount: 500,
      refunded: false,
      status: "published",
      payout: null,
      comboOdds: 12.5,
      kindVoid: false,
    }).move,
    -500,
  );
  assert.deepEqual(
    settleBet({
      amount: 100,
      refunded: true,
      status: "published",
      payout: { kind: "special", amount: 80 },
      comboOdds: null,
      kindVoid: true,
    }),
    { result: "特払い", odds: null, move: -20 },
  );
  assert.deepEqual(
    settleBet({
      amount: 200,
      refunded: true,
      status: "voting",
      payout: { kind: "refund", amount: 200 },
      comboOdds: null,
      kindVoid: null,
    }),
    { result: "返還", odds: null, move: null },
  );
  assert.equal(
    settleBet({
      amount: 100,
      refunded: false,
      status: "voting",
      payout: null,
      comboOdds: null,
      kindVoid: null,
    }).move,
    null,
  );
  assert.equal(
    settleBet({
      amount: 100,
      refunded: false,
      status: "closed",
      payout: null,
      comboOdds: 2.5,
      kindVoid: false,
    }).move,
    null,
  );
});
