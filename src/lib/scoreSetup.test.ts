import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
