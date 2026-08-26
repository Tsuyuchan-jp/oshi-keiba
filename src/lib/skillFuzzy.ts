/**
 * OCR スキル名 → カタログ名／id。
 * skill-emulator の fuzzyMatcher を移植（string-similarity 相当の Dice 係数）。
 * 緑×落とし・シミュ用 sanitize は持ち込まない。
 * 同名は先頭=unique、以降=継承進化→inherit（遺産と同じ）。
 */
import catalogJson from "../data/skill-catalog.json" with { type: "json" };

export type CatalogSkill = {
  name: string;
  kind: string;
  id: number;
};

const SKILLS = (catalogJson.skills as CatalogSkill[]).filter(
  (s) => typeof s.id === "number" && Number.isFinite(s.id),
);

const BY_NAME = new Map<string, CatalogSkill[]>();
for (const s of SKILLS) {
  const list = BY_NAME.get(s.name) ?? [];
  list.push(s);
  BY_NAME.set(s.name, list);
}

/** 照合用のユニークな正式名 */
const NAMES = [...BY_NAME.keys()];

/** ファジー閾値（遺産と同じ） */
export const FUZZY_MATCH_THRESHOLD = 0.45;

/** OCR 既知誤読 → 正式名（正規化後の完全一致） */
const OCR_SKILL_ALIASES: Record<string, string> = {
  千銀万錬: "千鍛万錬",
  千段万錬: "千鍛万錬",
  千錬万錬: "千鍛万錬",
};

function toHalfWidth(str: string): string {
  let s = str.replace(/[！-～]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
  s = s.replace(/〇/g, "○");
  return s;
}

export function normalizeSkillLabel(s: string): string {
  return toHalfWidth(s.replace(/[\s\u3000]+/g, ""));
}

/** string-similarity の compareTwoStrings と同型（Dice） */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigrams.get(bg) ?? 0;
    if (count > 0) {
      bigrams.set(bg, count - 1);
      hits += 1;
    }
  }
  return (2 * hits) / (a.length - 1 + (b.length - 1));
}

/** Levenshtein。短いラベル向け（OCR 一文字ずれ） */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const prev = new Array<number>(m + 1);
  const cur = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
    }
    for (let j = 0; j <= m; j++) prev[j] = cur[j]!;
  }
  return prev[m]!;
}

/** 遺産: special かつ同名に inherit がある＝継承進化 */
function isInheritEvolution(skill: CatalogSkill, siblings: CatalogSkill[]): boolean {
  if (skill.kind !== "special") return false;
  return siblings.some((s) => s.kind === "inherit");
}

function pickCatalogSkill(
  matched: CatalogSkill[],
  isFirstSkill: boolean,
): CatalogSkill | null {
  if (matched.length === 0) return null;
  if (matched.length === 1) {
    const only = matched[0]!;
    if (!isFirstSkill && only.kind === "unique") return null;
    return only;
  }
  if (isFirstSkill) {
    return matched.find((s) => s.kind === "unique") ?? matched[0]!;
  }
  const inheritEvo = matched.find((s) => isInheritEvolution(s, matched));
  if (inheritEvo) return inheritEvo;
  return matched.find((s) => s.kind !== "unique") ?? null;
}

function findBestSkillMatch(
  rawInput: string,
): { cleanInput: string; target: string; rating: number } | null {
  let cleanInput = normalizeSkillLabel(rawInput);
  if (!cleanInput) return null;
  cleanInput = OCR_SKILL_ALIASES[cleanInput] ?? cleanInput;

  // 編集距離≤1を先に見る（Dice が短い語で低く出るため）
  let editBest = "";
  let editDist = Infinity;
  let editDice = -1;
  for (const name of NAMES) {
    const norm = normalizeSkillLabel(name);
    const d = editDistance(cleanInput, norm);
    if (d > 1) continue;
    const rating = diceCoefficient(cleanInput, norm);
    if (
      d < editDist ||
      (d === editDist && rating > editDice)
    ) {
      editDist = d;
      editDice = rating;
      editBest = name;
    }
  }
  if (editBest && editDist <= 1) {
    return {
      cleanInput,
      target: editBest,
      rating: editDist === 0 ? 1 : Math.max(editDice, FUZZY_MATCH_THRESHOLD),
    };
  }

  let bestTarget = "";
  let bestRating = -1;
  const ratings: { target: string; rating: number }[] = [];
  for (const name of NAMES) {
    const rating = diceCoefficient(cleanInput, normalizeSkillLabel(name));
    ratings.push({ target: name, rating });
    if (rating > bestRating) {
      bestRating = rating;
      bestTarget = name;
    }
  }
  if (!bestTarget) return null;

  const inputSuffix = cleanInput.slice(-1);
  const hasSymbol = ["○", "◎", "×"].includes(inputSuffix);
  if (hasSymbol) {
    const exactSymbolMatches = ratings
      .filter((r) => r.target.endsWith(inputSuffix) && r.rating > 0.4)
      .sort((a, b) => b.rating - a.rating);
    if (exactSymbolMatches.length > 0) {
      return {
        cleanInput,
        target: exactSymbolMatches[0]!.target,
        rating: exactSymbolMatches[0]!.rating,
      };
    }
  }

  return { cleanInput, target: bestTarget, rating: bestRating };
}

export type FuzzySkillHit = {
  /** OCR 生文字列 */
  input: string;
  /** 採用したカタログ名（未採用は空） */
  name: string;
  id: number | null;
  kind: string;
  rating: number;
  accepted: boolean;
};

/**
 * 1件マッチ。同名が複数あるとき:
 * 先頭 → unique 優先 / 先頭以外 → 継承進化 → inherit 等（遺産と同じ）
 */
export function fuzzyMatchSkill(
  rawInput: string | null | undefined,
  isFirstSkill = false,
): FuzzySkillHit {
  const input = String(rawInput ?? "");
  const empty: FuzzySkillHit = {
    input,
    name: "",
    id: null,
    kind: "unknown",
    rating: 0,
    accepted: false,
  };
  if (!input.trim()) return empty;

  const best = findBestSkillMatch(input);
  if (!best || best.rating < FUZZY_MATCH_THRESHOLD) {
    return {
      ...empty,
      rating: best?.rating ?? 0,
      name: best?.target ?? "",
    };
  }

  const matched = BY_NAME.get(best.target) ?? [];
  const pick = pickCatalogSkill(matched, isFirstSkill);
  if (!pick) {
    return {
      ...empty,
      rating: best.rating,
      name: best.target,
    };
  }

  return {
    input,
    name: pick.name,
    id: pick.id,
    kind: pick.kind,
    rating: best.rating,
    accepted: true,
  };
}

/** OCR スキル名配列を名前＋id に解決する */
export function resolveOcrSkills(rawSkills: ReadonlyArray<string>): {
  skillNames: string[];
  skillIds: (number | null)[];
  hits: FuzzySkillHit[];
} {
  const hits = rawSkills.map((s, i) => fuzzyMatchSkill(s, i === 0));
  const skillNames: string[] = [];
  const skillIds: (number | null)[] = [];
  for (const h of hits) {
    if (!h.accepted || !h.name) continue;
    skillNames.push(h.name);
    skillIds.push(h.id);
  }
  return { skillNames, skillIds, hits };
}

export function catalogSkills(): readonly CatalogSkill[] {
  return SKILLS;
}
