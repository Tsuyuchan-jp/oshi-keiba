/**
 * 開催条件とステ目標値（events.score_setup）。
 * コースは U-tools 金ドット36。mdb 値はマスタから導出。
 * 有効スキル id は保存時にそのコース×4脚質だけ取得してスナップショットする。
 */
import coursesJson from "../data/score-courses.json" with { type: "json" };
import type { GreenEvalContext } from "./greenCondition.ts";
import type { RaceRequirements } from "./score.ts";
import {
  fetchEffectiveSkillIdsForCourse,
  parseEffectiveSkillIdsByStyle,
  resolveEffectStyleKey,
  type EffectStyleKey,
  type EffectiveSkillIdsByStyle,
} from "./utoolsEffects.ts";

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
  /**
   * 保存時に取った U-tools ranked スキル id（コース×脚質）。
   * 未取得の旧データは undefined（計算時は緑以外全部有効扱い）。
   */
  effectiveSkillIds?: EffectiveSkillIdsByStyle;
  /** ISO。リスト取得時刻 */
  effectsFetchedAt?: string;
  skillWeightN?: number;
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

/**
 * 管理画面の要求ステ初期表示（スタミナ以外）。
 * コース未選択のまま保存しても、これだけなら直置き扱い。
 */
export const DEFAULT_SCORE_REQ = {
  speedCap: 2150,
  power: 1600,
  guts: 1200,
  wisdom: 1600,
} as const;

export const SCORE_SKILL_BASE = 90;
export const DEFAULT_SCORE_SKILL_N = 4.5;
export const STAMINA_STYLE_KEYS = ["runner", "leader", "betweener", "chaser"] as const;
export type StaminaStyleKey = (typeof STAMINA_STYLE_KEYS)[number];

export function scoreSkillWeightN(setup: EventScoreSetup | null | undefined): number {
  const n = setup?.skillWeightN;
  return typeof n === "number" && Number.isFinite(n) && n >= 1 ? n : 1;
}

export function listScoreCourses(): ScoreCourse[] {
  return COURSES;
}

export function getScoreCourse(courseKey: string): ScoreCourse | undefined {
  return BY_KEY.get(String(courseKey).trim());
}

function isPosInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function parseStaminaByStyle(raw: unknown): RaceRequirements["staminaByStyle"] | null | undefined {
  if (raw == null) return undefined;
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const out: NonNullable<RaceRequirements["staminaByStyle"]> = {};
  for (const style of STAMINA_STYLE_KEYS) {
    const item = root[style];
    if (!item || typeof item !== "object") return null;
    const values = item as Record<string, unknown>;
    const noTempt = Number(values.noTempt);
    const withTempt = Number(values.withTempt);
    if (!isPosInt(noTempt) || !isPosInt(withTempt) || !Number.isInteger(noTempt) || !Number.isInteger(withTempt) || withTempt < noTempt) return null;
    out[style] = { noTempt, withTempt };
  }
  return out;
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
  const skillWeightN = root.skillWeightN == null ? undefined : Number(root.skillWeightN);
  const staminaRace = Boolean(r.staminaRace);
  const staminaByStyle = parseStaminaByStyle(r.staminaByStyle);

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
  if (staminaByStyle === null || staminaWithTempt < staminaNoTempt) return null;
  if (skillWeightN !== undefined && (!Number.isFinite(skillWeightN) || skillWeightN < 1 || skillWeightN > 10)) return null;
  if (!Number.isInteger(speedCap) || !Number.isInteger(staminaNoTempt) ||
      !Number.isInteger(staminaWithTempt) || !Number.isInteger(power) ||
      !Number.isInteger(guts) || !Number.isInteger(wisdom)) {
    return null;
  }

  const setup: EventScoreSetup = {
    conditions: { courseKey, weather, groundCondition, season },
    requirements: {
      speedCap,
      staminaNoTempt,
      staminaWithTempt,
      ...(staminaByStyle ? { staminaByStyle } : {}),
      staminaRace,
      power,
      guts,
      wisdom,
    },
  };
  if (skillWeightN !== undefined) setup.skillWeightN = skillWeightN;

  const ids = parseEffectiveSkillIdsByStyle(root.effectiveSkillIds);
  if (ids) setup.effectiveSkillIds = ids;
  const fetchedAt = root.effectsFetchedAt;
  if (typeof fetchedAt === "string" && fetchedAt.trim()) {
    setup.effectsFetchedAt = fetchedAt.trim();
  }

  return setup;
}

/**
 * 開催に保存された有効スキル id。脚質未解決・未取得なら null。
 */
export function effectiveIdsFromScoreSetup(
  setup: EventScoreSetup,
  style: string | EffectStyleKey,
): ReadonlySet<number> | null {
  const key = resolveEffectStyleKey(style);
  if (!key || !setup.effectiveSkillIds) return null;
  const list = setup.effectiveSkillIds[key];
  if (!list?.length) return null;
  return new Set(list);
}

/**
 * 保存直前: U-tools から当該コースの4脚質を取り直す。
 */
export async function enrichScoreSetupWithEffects(
  setup: EventScoreSetup,
  fetchImpl?: typeof fetch,
): Promise<EventScoreSetup> {
  const effectiveSkillIds = await fetchEffectiveSkillIdsForCourse(
    setup.conditions.courseKey,
    { fetchImpl },
  );
  return {
    ...setup,
    effectiveSkillIds,
    effectsFetchedAt: new Date().toISOString(),
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
  const staminaRaw = Object.fromEntries(STAMINA_STYLE_KEYS.map((style) => [style, {
    noTempt: get(`score_stamina_${style}_no`).trim(),
    withTempt: get(`score_stamina_${style}_with`).trim(),
  }])) as Record<StaminaStyleKey, { noTempt: string; withTempt: string }>;
  const legacyStamina = {
    noTempt: get("score_stamina_no").trim(),
    withTempt: get("score_stamina_with").trim(),
  };
  // 旧フォームを通すための読み替え。画面からは常に脚質別8項目を送る。
  const usingLegacyStamina = STAMINA_STYLE_KEYS.every((style) => !staminaRaw[style].noTempt && !staminaRaw[style].withTempt);
  const staminaByStyle = usingLegacyStamina
    ? Object.fromEntries(STAMINA_STYLE_KEYS.map((style) => [style, legacyStamina])) as Record<StaminaStyleKey, { noTempt: string; withTempt: string }>
    : staminaRaw;
  const powerRaw = get("score_power").trim();
  const gutsRaw = get("score_guts").trim();
  const wisdomRaw = get("score_wisdom").trim();
  const skillWeightNRaw = get("score_skill_weight_n").trim();
  const staminaRace = get("score_stamina_race") === "1";

  const any =
    courseKey ||
    weatherRaw ||
    groundRaw ||
    seasonRaw ||
    speedCapRaw ||
    STAMINA_STYLE_KEYS.some((style) => staminaByStyle[style].noTempt || staminaByStyle[style].withTempt) ||
    powerRaw ||
    gutsRaw ||
    wisdomRaw ||
    skillWeightNRaw ||
    staminaRace;

  /** 初期表示のデフォルトだけ埋まっている状態（コースなし＝直置き） */
  const onlyReqDefaults =
    !weatherRaw &&
    !groundRaw &&
    !seasonRaw &&
    STAMINA_STYLE_KEYS.every((style) => !staminaRaw[style].noTempt && !staminaRaw[style].withTempt) &&
    !legacyStamina.noTempt &&
    !legacyStamina.withTempt &&
    !staminaRace &&
    speedCapRaw === String(DEFAULT_SCORE_REQ.speedCap) &&
    powerRaw === String(DEFAULT_SCORE_REQ.power) &&
    gutsRaw === String(DEFAULT_SCORE_REQ.guts) &&
    wisdomRaw === String(DEFAULT_SCORE_REQ.wisdom) &&
    (!skillWeightNRaw || skillWeightNRaw === String(DEFAULT_SCORE_SKILL_N));

  if (!courseKey) {
    if (!any || onlyReqDefaults) return null;
    throw new Error("開催条件: コースを選ぶか、ステ目標の入力を空にしてください");
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
      // 旧形式との互換用にも共通値を残す。計算時は脚質別の値を優先する。
      staminaNoTempt: Number(staminaByStyle.runner.noTempt),
      staminaWithTempt: Number(staminaByStyle.runner.withTempt),
      ...(!usingLegacyStamina ? { staminaByStyle: Object.fromEntries(STAMINA_STYLE_KEYS.map((style) => [style, {
        noTempt: Number(staminaByStyle[style].noTempt),
        withTempt: Number(staminaByStyle[style].withTempt),
      }])) } : {}),
      staminaRace,
      power: Number(powerRaw),
      guts: Number(gutsRaw),
      wisdom: Number(wisdomRaw),
    },
    ...(skillWeightNRaw ? { skillWeightN: Number(skillWeightNRaw) } : {}),
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
