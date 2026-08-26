/**
 * 評価点パイプライン（作者側仮置き）。
 * Neko長明さん確定ではない。直置き Strength は別経路のまま残す。
 */
import {
  greenSkillByName,
  listAppliedGreensByNames,
  sumGreenBonusesByNames,
  type AppliedGreen,
  type GreenBonus,
} from "./greenSkills.ts";
import { classifySkillName } from "./skillCatalog.ts";
import type { GreenEvalContext } from "./greenCondition.ts";

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
  /**
   * skillNames と対になる mdb id。OCR が ID 化したあと渡す。
   * effectiveIds 指定時に使う。欠けた要素は無効扱い（ためらいは名前で救済）。
   */
  skillIds?: ReadonlyArray<number | null | undefined>;
  stats: HorseStats;
  aptitudes: HorseAptitudes;
  req: RaceRequirements;
  greenCtx: GreenEvalContext;
  /**
   * U-tools 有効スキル id。未指定なら名前リスト（effectiveNames）または緑以外全部。
   * ためらい4種はリスト外でも常に有効。
   */
  effectiveIds?: ReadonlySet<number>;
  /**
   * 互換用。effectiveIds が無いときの名前集合。
   * 未指定なら緑以外を全部有効とみなす。
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
  /** 条件成立した緑スキル（表示用） */
  appliedGreens: AppliedGreen[];
  adjusted: HorseStats;
  /** 倍率に掛ける前の r（スタミナは離散のため無し） */
  rawRatios: {
    speed: number;
    power: number;
    guts: number;
    wisdom: number;
  };
  /** 掛け算に使う倍率 */
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

/** ためらい4種の mdb id（リスト外でも常に有効） */
export const TAMERAI_IDS = new Set([200851, 200881, 200911, 200941]);

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

function isTameraiId(id: number | null | undefined): boolean {
  return id != null && TAMERAI_IDS.has(id);
}

function isGold(name: string): boolean {
  const kind = classifySkillName(name).kind;
  return kind === "gold";
}

/** 固有・進化は仮に金同等（リスト外でも採用＋+2）。緑マスタ名は除外。本番リスト整備後に外す想定 */
function isUniqueOrEvo(name: string): boolean {
  const kind = classifySkillName(name).kind;
  return kind === "unique" || kind === "evo";
}

/** 緑マスタに無い固有・進化だけ金扱い */
function isGoldLikeUniqueOrEvo(name: string): boolean {
  return isUniqueOrEvo(name) && !isGreenMaster(name);
}

function isGoldLike(name: string): boolean {
  return isGold(name) || isGoldLikeUniqueOrEvo(name);
}

export type SkillBaseOptions = {
  effectiveIds?: ReadonlySet<number>;
  skillIds?: ReadonlyArray<number | null | undefined>;
  effectiveNames?: ReadonlySet<string>;
};

/** スキル土台 S0。緑は除外。金・（緑以外の）固有・進化は有効に含めたうえで +2。ためらいは常に白1。 */
export function skillBase(
  skillNames: string[],
  effectiveNamesOrOpts?: ReadonlySet<string> | SkillBaseOptions,
): SkillBaseBreakdown {
  const opts: SkillBaseOptions =
    effectiveNamesOrOpts instanceof Set || effectiveNamesOrOpts == null
      ? { effectiveNames: effectiveNamesOrOpts ?? undefined }
      : effectiveNamesOrOpts;

  const countedNames: string[] = [];
  let goldCount = 0;
  let tameraiCount = 0;

  for (let i = 0; i < skillNames.length; i++) {
    const name = skillNames[i]!.trim();
    if (!name) continue;
    if (isGreenMaster(name)) continue;

    const id = opts.skillIds?.[i] ?? null;
    const tamerai = isTamerai(name) || isTameraiId(id);
    const forceAdopt = tamerai || isGoldLikeUniqueOrEvo(name);
    if (!forceAdopt) {
      if (opts.effectiveIds) {
        if (id == null || !opts.effectiveIds.has(id)) continue;
      } else if (opts.effectiveNames && !opts.effectiveNames.has(name)) {
        continue;
      }
    }

    countedNames.push(name);
    if (tamerai) {
      tameraiCount += 1;
      continue;
    }
    if (isGoldLike(name)) goldCount += 1;
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
  const skill = skillBase(input.skillNames, {
    effectiveIds: input.effectiveIds,
    skillIds: input.skillIds,
    effectiveNames: input.effectiveNames,
  });
  const green = sumGreenBonusesByNames(input.skillNames, input.greenCtx);
  const appliedGreens = listAppliedGreensByNames(input.skillNames, input.greenCtx);
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
    appliedGreens,
    adjusted,
    rawRatios: {
      speed: rSpeed,
      power: rPower,
      guts: rGuts,
      wisdom: rWis,
    },
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

/** 土台 S0 に枚数として入るか（緑は除外。緑以外の固有・進化・ためらいはリスト外でも true） */
export function skillCountsInBase(
  name: string,
  id: number | null | undefined,
  effectiveIds?: ReadonlySet<number> | null,
): boolean {
  const n = name.trim();
  if (!n) return false;
  if (isGreenMaster(n)) return false;
  if (isTamerai(n) || isTameraiId(id)) return true;
  if (isGoldLikeUniqueOrEvo(n)) return true;
  if (effectiveIds) return id != null && effectiveIds.has(id);
  return true;
}
