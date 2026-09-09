import assert from "node:assert/strict";
import { test } from "node:test";
import { paddockView } from "./paddockView.ts";
import type { Board } from "./storeTypes.ts";

const board = {
  event: {
    id: "event-1",
    title: "確認レース",
    score_setup: JSON.stringify({
      conditions: { courseKey: "10606", weather: 1, groundCondition: 1, season: 3 },
      requirements: { speedCap: 1200, staminaNoTempt: 600, staminaWithTempt: 800, staminaRace: false, power: 700, guts: 400, wisdom: 600 },
    }),
  },
  horses: [
    {
      number: 1,
      referenceOdds: 4.8,
      horse: {
        id: "horse-1", uma_name: "スペシャルウィーク", runner_name: "トレーナー I", chara_id: 1001, dress_id: 100101,
        shot_key: "shots/event-1/horse-1.png", scratched: 0,
        score_input: JSON.stringify({
          stats: { speed: 1200, stamina: 950, power: 1100, guts: 850, wisdom: 1000 },
          aptitudes: { turf: "S", dirt: "G", short: "G", mile: "A", medium: "S", long: "A", nige: "C", senkou: "A", sashi: "A", oikomi: "C" },
          skillNames: ["末脚", "コーナー巧者○"], skillIds: [null, null], styleKey: "leader",
        }),
      },
    },
    { number: 2, referenceOdds: null, horse: { id: "horse-2", uma_name: "欠場", runner_name: "", chara_id: null, dress_id: null, shot_key: null, scratched: 1, score_input: null } },
  ],
} as unknown as Board;

test("パドック表示用データは出走中の馬だけを必要な表示項目へ変換する", () => {
  const view = paddockView(board);
  assert.equal(view.title, "確認レース");
  assert.equal(view.commentsEnabled, false);
  assert.equal(view.horses.length, 1);
  const horse = view.horses[0]!;
  assert.equal(horse.dressName, "スペシャルドリーマー");
  assert.equal(horse.styleLabel, "先行");
  assert.equal(horse.odds, 4.8);
  assert.equal(horse.listImageUrl, "/images/umamusume/petit/petit_1001_100101_0011.png");
  assert.equal(horse.detailImageUrl, "/images/umamusume/petit/petit_1001_100101_0010.png");
  assert.equal(horse.skillPower, 2);
  assert.deepEqual(horse.stats, { speed: 1200, stamina: 950, power: 1100, guts: 850, wisdom: 1000 });
  assert.equal(horse.comment, null);
  assert.equal(horse.shotUrl, "/paddock/shot/horse-1?v=shots%2Fevent-1%2Fhorse-1.png");
});
