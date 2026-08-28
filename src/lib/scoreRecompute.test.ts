import assert from "node:assert/strict";
import { test } from "node:test";
import { serializeHorseScoreInput } from "./horseScoreInput.ts";
import { prepareAutoScoreRecompute } from "./scoreRecompute.ts";
import type { EventScoreSetup } from "./scoreSetup.ts";
import { addHorse, ensureEvent, getEventById } from "./store.ts";
import { createMemoryD1 } from "./testD1.ts";

const setup: EventScoreSetup = {
  conditions: { courseKey: "10901", weather: 1, groundCondition: 1, season: 3 },
  requirements: { speedCap: 1200, staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: false, power: 700, guts: 400, wisdom: 600 },
};

const input = {
  stats: { speed: 1200, stamina: 500, power: 800, guts: 450, wisdom: 700 },
  aptitudes: { turf: "A", dirt: "G", short: "S", mile: "A", medium: "B", long: "C", nige: "S", senkou: "A", sashi: "B", oikomi: "C" },
  skillNames: [], skillIds: [], styleKey: "runner" as const,
};

test("再計算: 出走登録中以外では中止する", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await db.prepare("UPDATE events SET status = 'voting' WHERE id = ?").bind(event.id).run();
  const voting = await getEventById(db, event.id);
  assert.ok(voting);
  await assert.rejects(
    prepareAutoScoreRecompute(db, voting, setup, []),
    /出走登録中だけ/,
  );
});

test("再計算: 評価条件が未設定なら中止する", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await assert.rejects(
    prepareAutoScoreRecompute(db, event, null, []),
    /評価条件が未設定/,
  );
});

test("再計算: 自動評価の材料不足は馬名を示して中止する", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await addHorse(db, event, "不足ウマ娘", "テスト", {
    strength: 10, seedSource: "auto", scoreInputJson: null, recordUndo: false,
  });
  await assert.rejects(
    prepareAutoScoreRecompute(db, event, setup, []),
    /自動算出できない出走があります: 不足ウマ娘（テスト）/,
  );
});

test("再計算: 手入力評価の材料不足は無視する", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await addHorse(db, event, "手入力ウマ娘", "テスト", {
    strength: 10, seedSource: "manual", scoreInputJson: null, recordUndo: false,
  });
  await addHorse(db, event, "自動ウマ娘", "テスト", {
    strength: 999, seedSource: "auto", scoreInputJson: serializeHorseScoreInput(input), recordUndo: false,
  });
  const changes = await prepareAutoScoreRecompute(db, event, setup, []);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].name, "自動ウマ娘（テスト）");
});
