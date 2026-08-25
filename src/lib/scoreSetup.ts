/**
 * 開催条件とステ目標値（events.score_setup）。
 * コースは U-tools 金ドット36。mdb 値はマスタから導出。
 */
import coursesJson from "../data/score-courses.json" with { type: "json" };
import type { GreenEvalContext } from "./greenCondition.ts";
import type { RaceRequirements } from "./score.ts";

export type EventRaceConditions = {
  /** U-tools courseId の文字列 */
  courseKey: string;
  weather: number;
  groundCondition: number;
  season: number;
};

export type EventScoreSetup = {
  conditions: EventRaceConditions;
  requirements: RaceRequirements;
};

export type ScoreCourse = {
  courseKey: string;
  label: string;
  place: string;
  trackId: number;
  rotation: number;
  groundType: number;
  distanceType: number;
  courseDistance: number;
};

const COURSES = (coursesJson as { courses: ScoreCourse[] }).courses;
const BY_KEY = new Map(COURSES.map((c) => [c.courseKey, c]));

export const WEATHER_OPTIONS = [
  { value: 1, label: "晴" },
  { value: 2, label: "曇" },
  { value: 3, label: "雨" },
  { value: 4, label: "雪" },
] as const;

export const GROUND_CONDITION_OPTIONS = [
  { value: 1, label: "良" },
  { value: 2, label: "稍重" },
  { value: 3, label: "重" },
  { value: 4, label: "不良" },
] as const;

export const SEASON_OPTIONS = [
  { value: 1, label: "春" },
  { value: 2, label: "夏" },
  { value: 3, label: "秋" },
  { value: 4, label: "冬" },
  { value: 5, label: "その他(5)" },
] as const;

export function listScoreCourses(): ScoreCourse[] {
  return COURSES;
}

export function getScoreCourse(courseKey: string): ScoreCourse | undefined {
  return BY_KEY.get(String(courseKey).trim());
}

function isPosInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function inOptionValues(
  n: number,
  opts: ReadonlyArray<{ value: number }>,
): boolean {
  return opts.some((o) => o.value === n);
}

/** DB / フォームから。不正なら null。 */
export function parseScoreSetup(raw: unknown): EventScoreSetup | null {
  if (raw == null || raw === "") return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const root = obj as Record<string, unknown>;
  const cond = root.conditions;
  const req = root.requirements;
  if (!cond || typeof cond !== "object" || !req || typeof req !== "object") {
    return null;
  }
  const c = cond as Record<string, unknown>;
  const r = req as Record<string, unknown>;
  const courseKey = String(c.courseKey ?? "").trim();
  if (!getScoreCourse(courseKey)) return null;

  const weather = Number(c.weather);
  const groundCondition = Number(c.groundCondition);
  const season = Number(c.season);
  if (!inOptionValues(weather, WEATHER_OPTIONS)) return null;
  if (!inOptionValues(groundCondition, GROUND_CONDITION_OPTIONS)) return null;
  if (!inOptionValues(season, SEASON_OPTIONS)) return null;

  const speedCap = Number(r.speedCap);
  const staminaNoTempt = Number(r.staminaNoTempt);
  const staminaWithTempt = Number(r.staminaWithTempt);
  const power = Number(r.power);
  const guts = Number(r.guts);
  const wisdom = Number(r.wisdom);
  const staminaRace = Boolean(r.staminaRace);

  if (
    !isPosInt(speedCap) ||
    !isPosInt(staminaNoTempt) ||
    !isPosInt(staminaWithTempt) ||
    !isPosInt(power) ||
    !isPosInt(guts) ||
    !isPosInt(wisdom)
  ) {
    return null;
  }
  if (!Number.isInteger(speedCap) || !Number.isInteger(staminaNoTempt) ||
      !Number.isInteger(staminaWithTempt) || !Number.isInteger(power) ||
      !Number.isInteger(guts) || !Number.isInteger(wisdom)) {
    return null;
  }

  return {
    conditions: { courseKey, weather, groundCondition, season },
    requirements: {
      speedCap,
      staminaNoTempt,
      staminaWithTempt,
      staminaRace,
      power,
      guts,
      wisdom,
    },
  };
}

export function serializeScoreSetup(setup: EventScoreSetup | null): string | null {
  if (!setup) return null;
  return JSON.stringify(setup);
}

/**
 * 管理フォームから。コース未選択なら null（直置きのみ）。
 * コースありで他が欠けるときは throw。
 */
export function scoreSetupFromForm(
  get: (name: string) => string,
): EventScoreSetup | null {
  const courseKey = get("score_course").trim();
  const weatherRaw = get("score_weather").trim();
  const groundRaw = get("score_ground_condition").trim();
  const seasonRaw = get("score_season").trim();
  const speedCapRaw = get("score_speed_cap").trim();
  const staNoRaw = get("score_stamina_no").trim();
  const staWithRaw = get("score_stamina_with").trim();
  const powerRaw = get("score_power").trim();
  const gutsRaw = get("score_guts").trim();
  const wisdomRaw = get("score_wisdom").trim();
  const staminaRace = get("score_stamina_race") === "1";

  const any =
    courseKey ||
    weatherRaw ||
    groundRaw ||
    seasonRaw ||
    speedCapRaw ||
    staNoRaw ||
    staWithRaw ||
    powerRaw ||
    gutsRaw ||
    wisdomRaw ||
    staminaRace;

  if (!courseKey) {
    if (any) {
      throw new Error("開催条件: コースを選ぶか、ステ目標の入力を空にしてください");
    }
    return null;
  }

  const parsed = parseScoreSetup({
    conditions: {
      courseKey,
      weather: Number(weatherRaw),
      groundCondition: Number(groundRaw),
      season: Number(seasonRaw),
    },
    requirements: {
      speedCap: Number(speedCapRaw),
      staminaNoTempt: Number(staNoRaw),
      staminaWithTempt: Number(staWithRaw),
      staminaRace,
      power: Number(powerRaw),
      guts: Number(gutsRaw),
      wisdom: Number(wisdomRaw),
    },
  });
  if (!parsed) {
    throw new Error("開催条件とステ目標値の入力が不正です");
  }
  return parsed;
}

/** 緑判定用。脚質・ステは頭側で足す。 */
export function greenCtxFromScoreSetup(
  setup: EventScoreSetup,
  extras?: Partial<GreenEvalContext>,
): GreenEvalContext {
  const course = getScoreCourse(setup.conditions.courseKey);
  const { weather, groundCondition, season } = setup.conditions;
  return {
    trackId: course?.trackId,
    rotation: course?.rotation,
    groundType: course?.groundType,
    distanceType: course?.distanceType,
    courseDistance: course?.courseDistance,
    weather,
    groundCondition,
    season,
    ...extras,
  };
}
