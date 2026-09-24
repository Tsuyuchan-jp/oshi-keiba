import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatVenueClosedHint,
  formatVenuePublishedHint,
  resolveVenueSlot,
  venueFinishRowHtml,
  venueFootHtml,
  venueHorseRowHtml,
  venuePayKindClass,
  venuePlaceRoman,
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

test("公開の着列は 1着 表記と着セルの place-1", () => {
  const html = venueHorseRowHtml({
    id: "h1",
    number: 1,
    umaName: "スズカ",
    runnerName: "a",
    styleLabel: "逃げ",
    odds: 2.0,
    place: 1,
  });
  assert.doesNotMatch(html, /sheet-row place-1/);
  assert.match(html, /class="c-place place-1"/);
  assert.match(html, /class="c-place place-1"[^>]*>1着</);
});

test("4着以降の着列は数字＋着で、表彰色クラスは付けない", () => {
  const html = venueHorseRowHtml({
    id: "h4",
    number: 4,
    umaName: "スズカ",
    runnerName: "a",
    styleLabel: "逃げ",
    odds: 8.0,
    place: 4,
  });
  assert.match(html, /class="c-place"[^>]*>4着</);
  assert.doesNotMatch(html, /place-4/);
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

test("公開注は特払いだけ。ローマと払戻クラス", () => {
  assert.equal(
    formatVenuePublishedHint(["3連単"]),
    "3連単は特払いです。当たりに投票がなかったため、使ったスペの8割が戻ります。",
  );
  assert.equal(
    formatVenuePublishedHint(["馬連", "馬単", "3連複", "3連単"]),
    "馬連・馬単・3連複・3連単は特払いです。当たりに投票がなかったため、使ったスペの8割が戻ります。",
  );
  assert.equal(formatVenuePublishedHint([]), "");
  assert.equal(venuePlaceRoman(1), "I");
  assert.equal(venuePlaceRoman(5), "V");
  assert.equal(venuePlaceRoman(6), "");
  assert.equal(venuePayKindClass("sanrenpuku"), "trio");
  assert.equal(venuePayKindClass("sanrentan"), "trif");
  assert.equal(venuePayKindClass("win"), "win");
});

test("確定盤の行はウマ番の右にウマ娘名。着ラベルは出さない", () => {
  const html = venueFinishRowHtml({
    place: 1,
    number: 7,
    umaName: "サイレンススズカ",
  });
  assert.match(html, /class="fin-rk">I</);
  assert.match(html, /class="fin-n">7</);
  assert.doesNotMatch(html, /1着|fin-place-lbl/);
  assert.match(html, /class="fin-uma"[^>]*>サイレンススズカ</);
});

test("場内足元のパドック導線は状態ごとに文言と買うボタンが分かれる", () => {
  const setupFoot = venueFootHtml({
    status: "setup",
    ctaHref: "/bet",
    closedHint: "",
    publishedHint: "",
    showUmabashira: true,
  });
  assert.match(setupFoot, /出走馬をパドックで見る/);
  assert.doesNotMatch(setupFoot, /馬券を買う/);
  assert.match(setupFoot, /投票開始までお待ちください/);
  assert.match(setupFoot, /ウマ柱を見る/);

  const votingFoot = venueFootHtml({
    status: "voting",
    ctaHref: "/login",
    closedHint: "",
    publishedHint: "",
    showUmabashira: true,
  });
  assert.match(votingFoot, /パドックを見る/);
  assert.doesNotMatch(votingFoot, /出走馬をパドックで見る/);
  assert.match(votingFoot, /馬券を買う/);
  assert.match(votingFoot, /ウマ柱を見る/);
  assert.match(votingFoot, /class="foot-voting"/);
  assert.match(votingFoot, /href="\/login"/);

  const closedFoot = venueFootHtml({
    status: "closed",
    ctaHref: "/bet",
    closedHint: "着順はまだ出ません。",
    publishedHint: "",
    showUmabashira: true,
  });
  assert.match(closedFoot, /出走馬をパドックで見る/);
  assert.doesNotMatch(closedFoot, /馬券を買う/);
  assert.match(closedFoot, /着順はまだ出ません/);
  assert.match(closedFoot, /ウマ柱を見る/);

  const closedWithTickets = venueFootHtml({
    status: "closed",
    ctaHref: "/bet",
    closedHint: "確定配当です。",
    publishedHint: "",
    showUmabashira: true,
    showClosedTicketLink: true,
  });
  assert.match(closedWithTickets, /href="\/tickets">自分の馬券を見る</);
  assert.match(closedWithTickets, /href="\/paddock">パドックを見る</);
  assert.match(closedWithTickets, /ウマ柱を見る/);
  assert.doesNotMatch(closedWithTickets, /出走馬をパドックで見る/);

  const closedGuest = venueFootHtml({
    status: "closed",
    ctaHref: "/bet",
    closedHint: "確定配当です。",
    publishedHint: "",
    showClosedTicketLink: true,
    closedTicketNeedsLogin: true,
  });
  assert.match(closedGuest, /href="\/login">ログインして自分の馬券を見る</);

  const publishedFoot = venueFootHtml({
    status: "published",
    ctaHref: "/bet",
    closedHint: "",
    publishedHint: "",
  });
  assert.doesNotMatch(publishedFoot, /paddock-cta/);
  assert.doesNotMatch(publishedFoot, /馬券を買う/);
});

test("場内オッズは上限を9999.9+で表示する", () => {
  const html = venueHorseRowHtml({
    id: "h1",
    number: 1,
    umaName: "スズカ",
    runnerName: "a",
    styleLabel: "逃げ",
    odds: 12_000,
  });
  assert.match(html, /class="odds-now">9999\.9\+</);
});
