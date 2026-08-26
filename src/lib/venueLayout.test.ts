import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatVenueClosedHint,
  resolveVenueSlot,
  venueHorseRowHtml,
  venueSlotFromClock,
  venueStyleLabel,
} from "./venueBoard.ts";

test("脚質はメンバー向けの全称。未選択は —", () => {
  assert.equal(venueStyleLabel("runner"), "逃げ");
  assert.equal(venueStyleLabel("leader"), "先行");
  assert.equal(venueStyleLabel("betweener"), "差し");
  assert.equal(venueStyleLabel("chaser"), "追込");
  assert.equal(venueStyleLabel(null), "—");
  assert.equal(venueStyleLabel("nope"), "—");
});

test("行はモックの sheet-row。ライブ用の data-sel と odds-now を残す", () => {
  const html = venueHorseRowHtml({
    id: "h1",
    number: 3,
    umaName: "サイレンススズカ",
    runnerName: "あお",
    styleLabel: "逃げ",
    odds: 3.2,
  });
  assert.match(html, /class="sheet-row"/);
  assert.match(html, /data-sel="h1"/);
  assert.match(html, /class="odds-now">3\.2</);
  assert.match(html, /逃げ/);
  assert.doesNotMatch(html, /Seed|評価点|控除/);
});

test("時間帯は JST。?slot= があれば固定", () => {
  const noonJst = Date.UTC(2026, 7, 26, 3, 0); // 12:00 JST
  const duskJst = Date.UTC(2026, 7, 26, 8, 0); // 17:00 JST
  const nightJst = Date.UTC(2026, 7, 26, 12, 0); // 21:00 JST
  assert.equal(venueSlotFromClock(noonJst), "day");
  assert.equal(venueSlotFromClock(duskJst), "dusk");
  assert.equal(venueSlotFromClock(nightJst), "night");
  assert.equal(resolveVenueSlot("night", noonJst), "night");
  assert.equal(resolveVenueSlot(null, noonJst), "day");
});

test("締切注は成立／特払い予定と着は出さない", () => {
  assert.equal(
    formatVenueClosedHint(["単勝", "馬連"], ["3連単"]),
    "単勝・馬連は成立予定です。3連単は特払い予定です。この賭式に使ったスペの8割が戻ります。着順はまだ出ません。",
  );
  assert.equal(formatVenueClosedHint([], []), "着順はまだ出ません。");
  assert.doesNotMatch(formatVenueClosedHint(["単勝"], ["3連単"]), /Seed|評価点|控除/);
});
