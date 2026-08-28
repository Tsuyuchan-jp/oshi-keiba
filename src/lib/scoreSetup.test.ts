import assert from "node:assert/strict";
import { test } from "node:test";
import {
  effectiveIdsFromScoreSetup,
  getScoreCourse,
  greenCtxFromScoreSetup,
  listScoreCourses,
  parseScoreSetup,
  scoreSetupFromForm,
  serializeScoreSetup,
} from "./scoreSetup.ts";

const SAMPLE = {
  conditions: {
    courseKey: "10606",
    weather: 1,
    groundCondition: 1,
    season: 3,
  },
  requirements: {
    speedCap: 1200,
    staminaNoTempt: 600,
    staminaWithTempt: 800,
    staminaRace: false,
    power: 700,
    guts: 400,
    wisdom: 600,
  },
};

const SAMPLE_WITH_IDS = {
  ...SAMPLE,
  effectiveSkillIds: {
    runner: [201601, 200261],
    leader: [201601],
    betweener: [201601],
    chaser: [201601],
  },
  effectsFetchedAt: "2026-08-25T00:00:00.000Z",
};

test("金ドット36コースが入っている", () => {
  const list = listScoreCourses();
  assert.equal(list.length, 36);
  assert.ok(getScoreCourse("10606"));
  assert.equal(getScoreCourse("10606")?.courseDistance, 2400);
  assert.equal(getScoreCourse("10606")?.trackId, 10006);
  assert.equal(getScoreCourse("10606")?.rotation, 2);
  assert.equal(getScoreCourse("10606")?.groundType, 1);
});

test("parse / serialize 往復", () => {
  const parsed = parseScoreSetup(SAMPLE);
  assert.ok(parsed);
  const again = parseScoreSetup(serializeScoreSetup(parsed));
  assert.deepEqual(again, SAMPLE);
});

test("不明コースは null", () => {
  assert.equal(
    parseScoreSetup({
      ...SAMPLE,
      conditions: { ...SAMPLE.conditions, courseKey: "99999" },
    }),
    null,
  );
});

test("greenCtx はコースから導出", () => {
  const setup = parseScoreSetup(SAMPLE)!;
  const ctx = greenCtxFromScoreSetup(setup, { runningStyle: 2 });
  assert.equal(ctx.trackId, 10006);
  assert.equal(ctx.rotation, 2);
  assert.equal(ctx.groundType, 1);
  assert.equal(ctx.distanceType, 3);
  assert.equal(ctx.courseDistance, 2400);
  assert.equal(ctx.weather, 1);
  assert.equal(ctx.season, 3);
  assert.equal(ctx.runningStyle, 2);
});

test("フォーム: 空なら null", () => {
  assert.equal(
    scoreSetupFromForm(() => ""),
    null,
  );
});

test("フォーム: コースだけだとエラー", () => {
  assert.throws(
    () =>
      scoreSetupFromForm((name) => (name === "score_course" ? "10606" : "")),
    /不正/,
  );
});

test("フォーム: 要求ステのデフォルトだけなら null", () => {
  const map: Record<string, string> = {
    score_speed_cap: "2150",
    score_power: "1600",
    score_guts: "1200",
    score_wisdom: "1600",
  };
  assert.equal(
    scoreSetupFromForm((n) => map[n] ?? ""),
    null,
  );
});

test("フォーム: 揃えば通る", () => {
  const map: Record<string, string> = {
    score_course: "10606",
    score_weather: "1",
    score_ground_condition: "1",
    score_season: "3",
    score_speed_cap: "1200",
    score_stamina_no: "600",
    score_stamina_with: "800",
    score_power: "700",
    score_guts: "400",
    score_wisdom: "600",
  };
  const setup = scoreSetupFromForm((n) => map[n] ?? "");
  assert.deepEqual(setup, SAMPLE);
});

test("effectiveSkillIds の往復と脚質 lookup", () => {
  const parsed = parseScoreSetup(SAMPLE_WITH_IDS);
  assert.ok(parsed?.effectiveSkillIds);
  const again = parseScoreSetup(serializeScoreSetup(parsed));
  assert.deepEqual(again, SAMPLE_WITH_IDS);
  const set = effectiveIdsFromScoreSetup(parsed!, "逃");
  assert.ok(set?.has(201601));
  assert.ok(set?.has(200261));
  assert.equal(effectiveIdsFromScoreSetup(parsed!, "不明"), null);
});

test("フォーム: 脚質別スタミナを保存し、掛かりありが低い値は弾く", () => {
  const map: Record<string, string> = {
    score_course: "10606", score_weather: "1", score_ground_condition: "1", score_season: "3",
    score_speed_cap: "1200", score_power: "700", score_guts: "400", score_wisdom: "600",
    score_stamina_runner_no: "600", score_stamina_runner_with: "800",
    score_stamina_leader_no: "610", score_stamina_leader_with: "810",
    score_stamina_betweener_no: "620", score_stamina_betweener_with: "820",
    score_stamina_chaser_no: "630", score_stamina_chaser_with: "830",
  };
  const setup = scoreSetupFromForm((n) => map[n] ?? "");
  assert.equal(setup?.requirements.staminaByStyle?.chaser?.withTempt, 830);
  map.score_stamina_chaser_with = "620";
  assert.throws(() => scoreSetupFromForm((n) => map[n] ?? ""), /不正/);
});

test("スキル重み n の往復と範囲検証", () => {
  const parsed = parseScoreSetup({ ...SAMPLE, skillWeightN: 4.5 });
  assert.equal(parsed?.skillWeightN, 4.5);
  assert.equal(parseScoreSetup({ ...SAMPLE, skillWeightN: 0 }), null);
  assert.equal(parseScoreSetup({ ...SAMPLE, skillWeightN: 10.1 }), null);
});
