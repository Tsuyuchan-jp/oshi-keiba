import assert from "node:assert/strict";
import { test } from "node:test";
import { overlayBySlogan, overlayColumns } from "./gougaiOverlay.ts";
import { gougaiPaperHtml } from "./gougaiPaper.ts";
import { charaStandUrl, defaultCharaStandUrl } from "./gougaiStand.ts";
import { GOUGAI_DEFAULT_SUBTITLE } from "./gougaiSubtitles.ts";
import { gougaiFacts, gougaiFileBase, gougaiView } from "./gougaiView.ts";
import type { Board } from "./storeTypes.ts";

const board = {
  event: {
    id: "event-1",
    title: "確認レース",
    status: "closed",
    score_setup: JSON.stringify({
      conditions: { courseKey: "10606", weather: 1, groundCondition: 1, season: 3 },
      requirements: { speedCap: 1200, staminaNoTempt: 600, staminaWithTempt: 800, staminaRace: false, power: 700, guts: 400, wisdom: 600 },
    }),
  },
  horses: [
    {
      number: 1,
      horse: {
        id: "horse-1",
        uma_name: "スペシャルウィーク",
        runner_name: "トレーナー I",
        chara_id: 1001,
        dress_id: 100130,
        trainer_icon_key: "icon-1",
        scratched: 0,
        finish_place: 1,
      },
    },
    {
      number: 2,
      horse: {
        id: "horse-2",
        uma_name: "欠場",
        runner_name: "",
        chara_id: null,
        dress_id: null,
        scratched: 1,
        finish_place: null,
      },
    },
  ],
} as unknown as Board;

test("1着があればウマ娘・stand・コース行を埋める", () => {
  const sheet = gougaiView(board);
  assert.equal(sheet.hasWinner, true);
  assert.equal(sheet.umaName, "スペシャルウィーク");
  assert.equal(sheet.runnerName, "トレーナー I");
  assert.equal(sheet.overlayLeft, "見事チャンピオンに");
  assert.equal(sheet.facts.course, "東京　芝2400m");
  assert.equal(sheet.facts.cond, "秋・晴・良　｜　1頭");
  assert.equal(sheet.standUrl, "/images/umamusume/stand/chara_stand_1001_100130.png");
  assert.equal(sheet.standFallbackUrl, "/images/umamusume/stand/chara_stand_1001_100101.png");
  assert.equal(sheet.subtitleFile, GOUGAI_DEFAULT_SUBTITLE);
  assert.equal(sheet.trainerIconUrl, "/admin/trainer-icon/horse-1?v=icon-1");
});

test("1着が無いときはプレースホルダ", () => {
  const setup = {
    ...board,
    event: { ...board.event, status: "setup" },
    horses: board.horses.map((h) => ({
      ...h,
      horse: { ...h.horse, finish_place: null },
    })),
  } as unknown as Board;
  const sheet = gougaiView(setup);
  assert.equal(sheet.hasWinner, false);
  assert.equal(sheet.umaName, "スペシャルウィーク");
  assert.equal(sheet.runnerName, "プレビュー太郎");
  assert.match(sheet.bodyHtml, /確認レース/);
});

test("開催設定が無いコース行は —", () => {
  assert.deepEqual(gougaiFacts(null, 3), { course: "—", cond: "—" });
});

test("ファイル名は日付と開催名", () => {
  assert.equal(
    gougaiFileBase("第3回春の合同練習杯", new Date("2026-09-04T16:00:00Z")),
    "2026-09-05-第3回春の合同練習杯-号外",
  );
});

test("縦書きはウマ娘名を差し込み、紙面に stand を出す", () => {
  const cols = overlayColumns(overlayBySlogan("見事チャンピオンに"), "グラスワンダー");
  assert.equal(cols.mid, "グラスワンダー");
  assert.equal(cols.left, "見事チャンピオンに");
  const html = gougaiPaperHtml(gougaiView(board));
  assert.match(html, /class="gougai-paper"/);
  assert.match(html, /chara_stand_1001_100130\.png/);
  assert.match(html, /data-stand-fallback="\/images\/umamusume\/stand\/chara_stand_1001_100101\.png"/);
  assert.match(html, /月刊つゅインクル　号外/);
});

test("既定衣装と同じ stand はフォールバックを持たない", () => {
  assert.equal(charaStandUrl(1001, 100101), "/images/umamusume/stand/chara_stand_1001_100101.png");
  assert.equal(defaultCharaStandUrl(1001, 100101), null);
});
