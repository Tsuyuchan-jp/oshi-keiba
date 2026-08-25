/**
 * 開催 score_setup ＋ 出走 score_input → computeScore。
 * 材料不足や脚質未選択なら null（直置き Strength へ逃げる）。
 */
import {
  type HorseScoreInput,
  runningStyleNumber,
} from "./horseScoreInput.ts";
import { computeScore, type HorseAptitudes, type ScoreBreakdown } from "./score.ts";
import {
  effectiveIdsFromScoreSetup,
  getScoreCourse,
  greenCtxFromScoreSetup,
  type EventScoreSetup,
} from "./scoreSetup.ts";
import type { EffectStyleKey } from "./utoolsEffects.ts";

function pickDistanceRank(
  apt: HorseScoreInput["aptitudes"],
  distanceType: number | undefined,
): string {
  switch (distanceType) {
    case 1:
      return apt.short;
    case 2:
      return apt.mile;
    case 3:
      return apt.medium;
    case 4:
      return apt.long;
    default:
      return "";
  }
}

function pickSurfaceRank(
  apt: HorseScoreInput["aptitudes"],
  groundType: number | undefined,
): string {
  if (groundType === 2) return apt.dirt;
  if (groundType === 1) return apt.turf;
  return "";
}

function pickStyleRank(
  apt: HorseScoreInput["aptitudes"],
  style: EffectStyleKey,
): string {
  switch (style) {
    case "runner":
      return apt.nige;
    case "leader":
      return apt.senkou;
    case "betweener":
      return apt.sashi;
    case "chaser":
      return apt.oikomi;
  }
}

export type ScoreFromHorseResult = {
  breakdown: ScoreBreakdown;
  /** Seed / Strength に載せる値（小数1桁） */
  strength: number;
};

/** 算出不能なら null */
export function scoreFromHorse(
  setup: EventScoreSetup | null | undefined,
  input: HorseScoreInput | null | undefined,
): ScoreFromHorseResult | null {
  if (!setup || !input?.styleKey) return null;
  const course = getScoreCourse(setup.conditions.courseKey);
  if (!course) return null;

  const style = input.styleKey;
  const aptitudes: HorseAptitudes = {
    distance: pickDistanceRank(input.aptitudes, course.distanceType),
    surface: pickSurfaceRank(input.aptitudes, course.groundType),
    style: pickStyleRank(input.aptitudes, style),
  };

  const greenCtx = greenCtxFromScoreSetup(setup, {
    runningStyle: runningStyleNumber(style),
    baseSpeed: input.stats.speed,
    baseStamina: input.stats.stamina,
    basePower: input.stats.power,
    baseGuts: input.stats.guts,
    baseWiz: input.stats.wisdom,
  });

  const effectiveIds = effectiveIdsFromScoreSetup(setup, style) ?? undefined;

  const breakdown = computeScore({
    skillNames: input.skillNames,
    skillIds: input.skillIds,
    stats: input.stats,
    aptitudes,
    req: setup.requirements,
    greenCtx,
    effectiveIds,
  });

  if (!Number.isFinite(breakdown.score) || breakdown.score < 0) return null;

  return {
    breakdown,
    strength: Math.round(breakdown.score * 10) / 10,
  };
}

/** 直置き強制でなければ算出値、だめなら手入力 */
export function resolveStrength(opts: {
  setup: EventScoreSetup | null | undefined;
  input: HorseScoreInput | null | undefined;
  manualStrength: number;
  forceManual: boolean;
}): { strength: number; source: "auto" | "manual" } {
  if (!opts.forceManual) {
    const auto = scoreFromHorse(opts.setup, opts.input);
    if (auto) return { strength: auto.strength, source: "auto" };
  }
  if (!(opts.manualStrength >= 0) || !Number.isFinite(opts.manualStrength)) {
    throw new Error("相対評価点が不正です");
  }
  return { strength: opts.manualStrength, source: "manual" };
}
