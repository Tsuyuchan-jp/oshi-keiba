import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseHorseScoreInput,
  styleKeyFromSoleS,
  serializeHorseScoreInput,
} from "./horseScoreInput.ts";
import { resolveStrength, scoreFromHorse } from "./scoreFromHorse.ts";
import type { EventScoreSetup } from "./scoreSetup.ts";

const SETUP: EventScoreSetup = {
  conditions: {
    courseKey: "10901",
    weather: 1,
    groundCondition: 1,
    season: 3,
  },
  requirements: {
    speedCap: 1200,
    staminaNoTempt: 400,
    staminaWithTempt: 500,
    staminaRace: false,
    power: 700,
    guts: 400,
    wisdom: 600,
  },
  effectiveSkillIds: {
    runner: [201601, 200012, 200851],
    leader: [201601],
    betweener: [201601],
    chaser: [201601],
  },
};

const INPUT = {
  stats: { speed: 1200, stamina: 500, power: 800, guts: 450, wisdom: 700 },
  aptitudes: {
    turf: "A",
    dirt: "G",
    short: "S",
    mile: "A",
    medium: "B",
    long: "C",
    nige: "S",
    senkou: "A",
    sashi: "B",
    oikomi: "C",
  },
  skillNames: ["右回り○", "逃げためらい"],
  skillIds: [200012, 200851] as (number | null)[],
  styleKey: "runner" as const,
};

test("脚質 S が1つだけなら初期キー", () => {
  assert.equal(styleKeyFromSoleS(INPUT.aptitudes), "runner");
  assert.equal(
    styleKeyFromSoleS({ ...INPUT.aptitudes, senkou: "S" }),
    null,
  );
});

test("score_input 往復", () => {
  const parsed = parseHorseScoreInput(INPUT);
  assert.ok(parsed);
  assert.deepEqual(parseHorseScoreInput(serializeHorseScoreInput(parsed)), parsed);
});

test("脚質未選択は算出不可", () => {
  assert.equal(
    scoreFromHorse(SETUP, { ...INPUT, styleKey: null }),
    null,
  );
});

test("算出できると auto strength", () => {
  const r = resolveStrength({
    setup: SETUP,
    input: INPUT,
    manualStrength: 10,
    forceManual: false,
  });
  assert.equal(r.source, "auto");
  assert.ok(r.strength > 0);
});

test("脚質別スタミナを優先して評価する", () => {
  const setup: EventScoreSetup = {
    ...SETUP,
    requirements: {
      ...SETUP.requirements,
      staminaByStyle: {
        runner: { noTempt: 501, withTempt: 600 },
        leader: { noTempt: 400, withTempt: 500 },
        betweener: { noTempt: 400, withTempt: 500 },
        chaser: { noTempt: 400, withTempt: 500 },
      },
    },
  };
  assert.equal(scoreFromHorse(setup, INPUT)?.breakdown.ratios.staminaMult, 0.4);
});

test("直置き強制", () => {
  const r = resolveStrength({
    setup: SETUP,
    input: INPUT,
    manualStrength: 12.5,
    forceManual: true,
  });
  assert.equal(r.source, "manual");
  assert.equal(r.strength, 12.5);
});
