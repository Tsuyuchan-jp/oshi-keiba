import assert from "node:assert/strict";
import { test } from "node:test";
import {
  achieveMult,
  computeScore,
  ratioMult,
  skillBase,
  skillCountsInBase,
  speedMult,
  staminaMult,
} from "./score.ts";

test("skillCountsInBase: リスト外は false、ためらいは true", () => {
  const ids = new Set([201601]);
  assert.equal(skillCountsInBase("地固め", 201601, ids), true);
  assert.equal(skillCountsInBase("別のスキル", 999999, ids), false);
  assert.equal(skillCountsInBase("逃げためらい", 200851, ids), true);
});

test("skillCountsInBase: 固有・進化はリスト外でも true（緑マスタ重複は除く）", () => {
  const ids = new Set([201601]);
  assert.equal(skillCountsInBase("波乱注意砲！", 10071, ids), true);
  assert.equal(skillCountsInBase("鎧袖一触", 101701211, ids), true);
  assert.equal(skillCountsInBase("右回りの輪舞曲", 106701211, ids), false);
});

test("金は有効1＋追加2で計3", () => {
  const s = skillBase(["円弧のマエストロ", "地固め"]);
  assert.equal(s.effectiveCount, 2);
  assert.equal(s.goldCount, 1);
  assert.equal(s.base, 2 + 2);
});

test("固有・進化はリスト外でも金同等（枚数1＋+2）", () => {
  const s = skillBase(["波乱注意砲！", "鎧袖一触", "地固め"], {
    effectiveIds: new Set([201601]),
    skillIds: [10071, 101701211, 201601],
  });
  assert.deepEqual(s.countedNames, ["波乱注意砲！", "鎧袖一触", "地固め"]);
  assert.equal(s.goldCount, 2);
  assert.equal(s.base, 3 + 4);
});

test("緑マスタ重複の進化は土台に入れない", () => {
  const s = skillBase(["右回りの輪舞曲", "地固め"], {
    effectiveIds: new Set([201601]),
    skillIds: [106701211, 201601],
  });
  assert.deepEqual(s.countedNames, ["地固め"]);
  assert.equal(s.goldCount, 0);
  assert.equal(s.base, 1);
});

test("緑マスタは土台に入れない", () => {
  const s = skillBase(["右回り○", "地固め"]);
  assert.deepEqual(s.countedNames, ["地固め"]);
  assert.equal(s.base, 1);
});

test("ためらいは有効リスト外でも白1", () => {
  const s = skillBase(["逃げためらい", "地固め"], new Set(["地固め"]));
  assert.equal(s.tameraiCount, 1);
  assert.equal(s.effectiveCount, 2);
  assert.equal(s.base, 2);
});

test("有効リスト外の白は落とす", () => {
  const s = skillBase(["地固め", "コンセントレーション"], new Set(["地固め"]));
  assert.deepEqual(s.countedNames, ["地固め"]);
});

test("effectiveIds + skillIds で絞る", () => {
  const s = skillBase(["地固め", "コンセントレーション"], {
    effectiveIds: new Set([201601]),
    skillIds: [201601, 200261],
  });
  assert.deepEqual(s.countedNames, ["地固め"]);
});

test("ためらい id は effectiveIds 外でも白1", () => {
  const s = skillBase(["逃げためらい", "地固め"], {
    effectiveIds: new Set([201601]),
    skillIds: [200851, 201601],
  });
  assert.equal(s.tameraiCount, 1);
  assert.equal(s.effectiveCount, 2);
});

test("達成Aと未達M", () => {
  assert.equal(achieveMult(1, 4), 1);
  assert.ok(Math.abs(achieveMult(1.2, 4) - 1.05) < 1e-9);
  assert.ok(Math.abs(ratioMult(0.9, 4, 4) - 0.6) < 1e-9);
  assert.equal(ratioMult(0.75, 4, 4), 0);
  assert.equal(speedMult(0.9), 1);
  assert.ok(Math.abs(speedMult(1.2) - 1.05) < 1e-9);
});

test("スタミナ離散", () => {
  assert.equal(staminaMult(500, { staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: false }), 1);
  assert.equal(staminaMult(450, { staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: false }), 0.8);
  assert.equal(staminaMult(350, { staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: false }), 0.4);
  assert.equal(staminaMult(350, { staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: true }), 0.2);
  assert.equal(staminaMult(450, { staminaNoTempt: 400, staminaWithTempt: 500, staminaRace: true }), 0.4);
});

test("パイプライン: 右回り○と距離Sで速が伸びる", () => {
  const base = computeScore({
    skillNames: ["地固め"],
    stats: { speed: 1200, stamina: 800, power: 800, guts: 400, wisdom: 800 },
    aptitudes: { distance: "A", surface: "A", style: "A" },
    req: {
      speedCap: 1200,
      staminaNoTempt: 700,
      staminaWithTempt: 800,
      staminaRace: false,
      power: 800,
      guts: 400,
      wisdom: 800,
    },
    greenCtx: { rotation: 1 },
  });
  assert.equal(base.skill.base, 1);
  assert.equal(base.score, 1);

  const withGreen = computeScore({
    skillNames: ["地固め", "右回り○"],
    stats: { speed: 1200, stamina: 800, power: 800, guts: 400, wisdom: 800 },
    aptitudes: { distance: "S", surface: "A", style: "A" },
    req: {
      speedCap: 1200,
      staminaNoTempt: 700,
      staminaWithTempt: 800,
      staminaRace: false,
      power: 800,
      guts: 400,
      wisdom: 800,
    },
    greenCtx: { rotation: 1 },
  });
  // (1200+40)*1.1 / 1200 = 1.1366… → 速倍率 1+(r-1)/4
  const r = (1240 * 1.1) / 1200;
  const expect = 1 * (1 + (r - 1) / 4);
  assert.ok(Math.abs(withGreen.score - expect) < 1e-9);
  assert.equal(withGreen.green.speed, 40);
});

test("パワー未達で大きく落ちる", () => {
  const s = computeScore({
    skillNames: ["地固め"],
    stats: { speed: 1200, stamina: 800, power: 720, guts: 400, wisdom: 800 },
    aptitudes: { distance: "A", surface: "A", style: "A" },
    req: {
      speedCap: 1200,
      staminaNoTempt: 700,
      staminaWithTempt: 800,
      staminaRace: false,
      power: 800,
      guts: 400,
      wisdom: 800,
    },
    greenCtx: {},
  });
  // rパ=0.9 → ×0.6
  assert.ok(Math.abs(s.score - 0.6) < 1e-9);
});
