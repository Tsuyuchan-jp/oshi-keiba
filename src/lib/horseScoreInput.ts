/**
 * 出走1頭分の評価点材料（horses.score_input）。
 * OCR／手入力の保存形。Seed に使う Strength は別列。
 */
import type { EffectStyleKey } from "./utoolsEffects.ts";
import { resolveEffectStyleKey } from "./utoolsEffects.ts";

export type HorseAptitudeBoard = {
  turf: string;
  dirt: string;
  short: string;
  mile: string;
  medium: string;
  long: string;
  nige: string;
  senkou: string;
  sashi: string;
  oikomi: string;
};

export type HorseScoreInput = {
  stats: {
    speed: number;
    stamina: number;
    power: number;
    guts: number;
    wisdom: number;
  };
  aptitudes: HorseAptitudeBoard;
  skillNames: string[];
  /** skillNames と対。未解決は null */
  skillIds: (number | null)[];
  /**
   * OCR でカタログに載らなかった生のスキル名。
   * 評価点には使わない。直し画面の「不採用」表示用。
   */
  skippedSkillNames?: string[];
  /**
   * 出走脚質。U-tools キー。未選択は null。
   * 緑の runningStyle は 1=逃 … 4=追。
   */
  styleKey: EffectStyleKey | null;
};

const APT_KEYS = [
  "turf",
  "dirt",
  "short",
  "mile",
  "medium",
  "long",
  "nige",
  "senkou",
  "sashi",
  "oikomi",
] as const;

function isNonNegInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function aptRank(raw: unknown): string {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!s) return "";
  if (s === "5") return "S";
  if (s === "4") return "A";
  if (s === "8") return "B";
  if (s === "6" || s === "0") return "G";
  return s;
}

function parseAptitudes(raw: unknown): HorseAptitudeBoard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: Partial<HorseAptitudeBoard> = {};
  for (const k of APT_KEYS) {
    out[k] = aptRank(o[k]);
  }
  return out as HorseAptitudeBoard;
}

/** DB / フォーム JSON。不正なら null */
export function parseHorseScoreInput(raw: unknown): HorseScoreInput | null {
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
  const st = root.stats;
  if (!st || typeof st !== "object") return null;
  const statsObj = st as Record<string, unknown>;
  const speed = Number(statsObj.speed);
  const stamina = Number(statsObj.stamina);
  const power = Number(statsObj.power);
  const guts = Number(statsObj.guts);
  const wisdom = Number(statsObj.wisdom);
  if (
    ![speed, stamina, power, guts, wisdom].every((n) => isNonNegInt(n))
  ) {
    return null;
  }
  const aptitudes = parseAptitudes(root.aptitudes);
  if (!aptitudes) return null;

  const namesRaw = root.skillNames;
  if (!Array.isArray(namesRaw)) return null;
  const skillNames = namesRaw.map((n) => String(n ?? "").trim()).filter(Boolean);

  const idsRaw = root.skillIds;
  const skillIds: (number | null)[] = [];
  if (Array.isArray(idsRaw)) {
    for (let i = 0; i < skillNames.length; i++) {
      const v = idsRaw[i];
      if (v == null || v === "") {
        skillIds.push(null);
        continue;
      }
      const n = Number(v);
      skillIds.push(Number.isFinite(n) && n > 0 ? n : null);
    }
  } else {
    for (let i = 0; i < skillNames.length; i++) skillIds.push(null);
  }

  let styleKey: EffectStyleKey | null = null;
  if (root.styleKey != null && root.styleKey !== "") {
    styleKey = resolveEffectStyleKey(String(root.styleKey));
    if (!styleKey) return null;
  }

  const skippedRaw = root.skippedSkillNames;
  const skippedSkillNames = Array.isArray(skippedRaw)
    ? skippedRaw.map((n) => String(n ?? "").trim()).filter(Boolean)
    : undefined;

  return {
    stats: { speed, stamina, power, guts, wisdom },
    aptitudes,
    skillNames,
    skillIds,
    ...(skippedSkillNames && skippedSkillNames.length > 0
      ? { skippedSkillNames }
      : {}),
    styleKey,
  };
}

export function serializeHorseScoreInput(
  input: HorseScoreInput | null,
): string | null {
  if (!input) return null;
  return JSON.stringify(input);
}

/** 脚質キー → 緑 condition の running_style（1〜4） */
export function runningStyleNumber(style: EffectStyleKey): number {
  switch (style) {
    case "runner":
      return 1;
    case "leader":
      return 2;
    case "betweener":
      return 3;
    case "chaser":
      return 4;
  }
}

/** 脚質適性に S が1つだけならそのキー、それ以外は null */
export function styleKeyFromSoleS(
  apt: Pick<HorseAptitudeBoard, "nige" | "senkou" | "sashi" | "oikomi">,
): EffectStyleKey | null {
  const pairs: [EffectStyleKey, string][] = [
    ["runner", apt.nige],
    ["leader", apt.senkou],
    ["betweener", apt.sashi],
    ["chaser", apt.oikomi],
  ];
  const hits = pairs.filter(([, r]) => String(r).toUpperCase() === "S");
  return hits.length === 1 ? hits[0]![0] : null;
}

export const STYLE_OPTIONS: { key: EffectStyleKey; label: string }[] = [
  { key: "runner", label: "逃" },
  { key: "leader", label: "先" },
  { key: "betweener", label: "差" },
  { key: "chaser", label: "追" },
];
