import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocateSeed,
  displayPool,
  parimutuelOdds,
  payoutAmount,
  wCombined,
  wTime,
  wVolume,
} from "./odds.ts";

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
