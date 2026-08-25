/**
 * 評価点パイプライン（作者側仮置き）。
 * Neko長明さん確定ではない。直置き Strength は別経路のまま残す。
 */
import { evalGreenCondition, type GreenEvalContext } from "./greenCondition.ts";
import { greenSkillByName, sumGreenBonusesByNames, type GreenBonus } from "./greenSkills.ts";
import { classifySkillName } from "./skillCatalog.ts";

export type HorseStats = {
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wisdom: number;
};

/** 適正ランク。S 以外は倍率なし。 */
export type AptitudeRank = string;

export type HorseAptitudes = {
  /** 距離（短〜長のうち該当） */
  distance: AptitudeRank;
  /** バ場（芝／ダの該当） */
  surface: AptitudeRank;
  /** 出走脚質の適性 */
  style: AptitudeRank;
};

export type RaceRequirements = {
  /** 継承突破なしのスピードカンスト */
  speedCap: number;
  staminaNoTempt: number;
  staminaWithTempt: number;
  /** スタミナ勝負コース */
  staminaRace: boolean;
  power: number;
  guts: number;
  wisdom: number;
};

export type ScoreInput = {
  skillNames: string[];
  stats: HorseStats;
  aptitudes: HorseAptitudes;
  req: RaceRequirements;
  greenCtx: GreenEvalContext;
  /**
   * U-tools 有効スキル名。未指定なら緑マスタ以外を全部有効とみなす。
   * ためらい4種はリスト外でも常に有効。
   */
  effectiveNames?: ReadonlySet<string>;
};

export type SkillBaseBreakdown = {
  base: number;
  effectiveCount: number;
  goldCount: number;
  tameraiCount: number;
  countedNames: string[];
};

export type ScoreBreakdown = {
  score: number;
  skill: SkillBaseBreakdown;
  green: GreenBonus;
  adjusted: HorseStats;
  ratios: {
    speed: number;
    staminaMult: number;
    power: number;
    guts: number;
    wisdom: number;
  };
};

const TAMERAI = new Set([
  "逃げためらい",
  "先行ためらい",
  "差しためらい",
  "追込ためらい",
]);

const DIST_S = 1.1;
const SURFACE_S = 1.05;
const STYLE_S = 1.1;

function isS(rank: AptitudeRank): boolean {
  return String(rank).trim().toUpperCase() === "S";
}

function isGreenMaster(name: string): boolean {
  return greenSkillByName(name) != null;
}

function isTamerai(name: string): boolean {
  return TAMERAI.has(name.trim());
}

function isGold(name: string): boolean {
  const kind = classifySkillName(name).kind;
  return kind === "gold";
}

/** スキル土台 S0。緑は除外。金は有効に含めたうえで +2。ためらいは常に白1。 */
export function skillBase(
  skillNames: string[],
  effectiveNames?: ReadonlySet<string>,
): SkillBaseBreakdown {
  const countedNames: string[] = [];
  let goldCount = 0;
  let tameraiCount = 0;

  for (const raw of skillNames) {
    const name = raw.trim();
    if (!name) continue;
    if (isGreenMaster(name)) continue;

    const tamerai = isTamerai(name);
    if (!tamerai && effectiveNames && !effectiveNames.has(name)) continue;

    countedNames.push(name);
    if (tamerai) {
      tameraiCount += 1;
      continue;
    }
    if (isGold(name)) goldCount += 1;
  }

  const effectiveCount = countedNames.length;
  const base = effectiveCount + 2 * goldCount;
  return { base, effectiveCount, goldCount, tameraiCount, countedNames };
}

export function achieveMult(r: number, n: number): number {
  if (!(r >= 1) || !Number.isFinite(r)) return 1;
  return 1 + (r - 1) / n;
}

/** 達成 A / 未達 1+(r−1)×M。下限 0。 */
export function ratioMult(r: number, n: number, m: number): number {
  if (!Number.isFinite(r) || r <= 0) return 0;
  if (r >= 1) return 1 + (r - 1) / n;
  return Math.max(0, 1 + (r - 1) * m);
}

/** スピード専用: 未達は掛けない。 */
export function speedMult(r: number): number {
  if (!(r >= 1) || !Number.isFinite(r)) return 1;
  return 1 + (r - 1) / 4;
}

export function staminaMult(
  stamina: number,
  req: Pick<RaceRequirements, "staminaNoTempt" | "staminaWithTempt" | "staminaRace">,
): number {
  const no = stamina >= req.staminaNoTempt;
  const withT = stamina >= req.staminaWithTempt;
  if (no && withT) return 1;
  if (req.staminaRace) {
    if (!no) return 0.2;
    return 0.4; // 掛かりありのみ未達
  }
  if (!no) return 0.4;
  return 0.8;
}

function adjustStats(
  stats: HorseStats,
  green: GreenBonus,
  apt: HorseAptitudes,
): HorseStats {
  const speed = (stats.speed + green.speed) * (isS(apt.distance) ? DIST_S : 1);
  const stamina = stats.stamina + green.stamina;
  const power = (stats.power + green.power) * (isS(apt.surface) ? SURFACE_S : 1);
  const guts = stats.guts + green.guts;
  const wisdom = (stats.wisdom + green.wisdom) * (isS(apt.style) ? STYLE_S : 1);
  return { speed, stamina, power, guts, wisdom };
}

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const skill = skillBase(input.skillNames, input.effectiveNames);
  const green = sumGreenBonusesByNames(input.skillNames, input.greenCtx);
  const adjusted = adjustStats(input.stats, green, input.aptitudes);
  const req = input.req;

  let score = skill.base;

  const rSpeed = req.speedCap > 0 ? adjusted.speed / req.speedCap : 1;
  const mSpeed = speedMult(rSpeed);
  score *= mSpeed;

  const mSta = staminaMult(adjusted.stamina, req);
  score *= mSta;

  const rPower = req.power > 0 ? adjusted.power / req.power : 1;
  const mPower = ratioMult(rPower, 4, 4);
  score *= mPower;

  const rGuts = req.guts > 0 ? adjusted.guts / req.guts : 1;
  const mGuts = ratioMult(rGuts, 10, 2);
  score *= mGuts;

  const rWis = req.wisdom > 0 ? adjusted.wisdom / req.wisdom : 1;
  const mWis = ratioMult(rWis, 1, 6);
  score *= mWis;

  return {
    score,
    skill,
    green,
    adjusted,
    ratios: {
      speed: mSpeed,
      staminaMult: mSta,
      power: mPower,
      guts: mGuts,
      wisdom: mWis,
    },
  };
}

export function isTameraiName(name: string): boolean {
  return isTamerai(name);
}
