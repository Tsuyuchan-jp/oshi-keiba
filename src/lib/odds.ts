/**
 * オッズと確定配当（docs/specifications/odds.md）
 *
 * odds-v4: 投票中も締切後も同じ式。Seed を確定配当と払戻に残す。特払い B は出さない。
 * odds-v3 の表示用に、w・E・Imputed・評価点下限の計算は残す。新しい開催では使わない。
 */

import type { BetKind } from "./bets";

/** 開催の初期値。第2回は案 B（docs/now.md） */
export const DEFAULTS = {
  grantG: 3000,
  betUnit: 100,
  typicalBet: 700,
  seedPoolS: 135000,
  pullE: 100000,
  takeoutD: 0.2,
  /** 時間側の下限。時計だけでは 0 にしない（厚め） */
  wTimeFloor: 0.8,
  wTimeExp: 1,
} as const;

/** 連勝を単勝参考へ乗せる係数。管理画面では触らない */
export const IMPUTED_LAMBDA = 1;

/**
 * 連勝 Seed 用。賭式ごとに実票で薄める基準額（docs/specifications/exotic-seed.md）。
 * 第2回の投票中、馬連・3連複の実票が試用値に達して参考オッズの Seed が消えたため、
 * 馬連 50,000・3連複 40,000 へ引き上げた。馬単・3連単は試用値のまま。
 */
export const EXOTIC_PULL_E: Record<Exclude<BetKind, "win">, number> = {
  umaren: 50_000,
  umatan: 7_000,
  sanrenpuku: 40_000,
  sanrentan: 7_000,
};

/** 連勝は単勝より人気差を少し強める。 */
export const EXOTIC_GAMMA = 2;

/** 新しい開催の式。既存開催は odds-v3 とマークし、この式では計算しない。 */
export const FORMULA_V4 = "odds-v4";
export const FORMULA_V3 = "odds-v3";

/**
 * 単勝 S に掛ける賭式比。実競馬3日の投票額比で、コード定数。開催ごとに取り直さない。
 * 馬連 1.37、馬単 0.59、3連複 2.60、3連単 2.69。
 */
export const SEED_RATIOS = {
  umaren: 1.37,
  umatan: 0.59,
  sanrenpuku: 2.6,
  sanrentan: 2.69,
} as const;

export type ExoticSeeds = {
  umaren: number;
  umatan: number;
  sanrenpuku: number;
  sanrentan: number;
};

/** 単勝 S から他4賭式の S を 1 スペ単位で四捨五入する。 */
export function exoticSeedsFromWin(winS: number): ExoticSeeds {
  const win = Number.isFinite(winS) && winS > 0 ? winS : 0;
  return {
    umaren: Math.round(win * SEED_RATIOS.umaren),
    umatan: Math.round(win * SEED_RATIOS.umatan),
    sanrenpuku: Math.round(win * SEED_RATIOS.sanrenpuku),
    sanrentan: Math.round(win * SEED_RATIOS.sanrentan),
  };
}

export function isOddsV4(event: { formula_version?: string | null }): boolean {
  return event.formula_version === FORMULA_V4;
}

/** 賭式ごとの Seed 合計。単勝は seed_pool_s、他は保存済みの列。 */
export function seedForKind(
  event: {
    seed_pool_s: number;
    seed_umaren: number;
    seed_umatan: number;
    seed_sanrenpuku: number;
    seed_sanrentan: number;
  },
  kind: BetKind,
): number {
  if (kind === "umaren") return event.seed_umaren;
  if (kind === "umatan") return event.seed_umatan;
  if (kind === "sanrenpuku") return event.seed_sanrenpuku;
  if (kind === "sanrentan") return event.seed_sanrentan;
  return event.seed_pool_s;
}

/**
 * 連勝の参考オッズ用にだけ使う評価点下限。
 *
 * 第2回メンバーシップ特別レースでの暫定値。低評価の出走者を含む買い目の
 * 参考オッズが極端にならないようにするためのもので、表示する評価点、単勝、
 * 締切後の確定配当には適用しない。開催後にメンバーの反応と実績を見て見直す。
 */
export const EXOTIC_STRENGTH_FLOOR = 70;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 票量側 w。下限 0。E の半分でだいたい半分。TV は単勝参考用（単勝＋λ×連勝） */
export function wVolume(realTotal: number, pullE: number): number {
  if (!(pullE > 0)) return 0;
  return Math.max(0, 1 - realTotal / pullE);
}

/**
 * 時間側 w。下限は厚め。締切未設定なら減衰しない（強制ボタン用）。
 * remaining^exp で曲線。exp=1 が直線。
 */
export function wTime(
  nowMs: number,
  openedAtMs: number | null,
  closesAtMs: number | null,
  floor: number,
  exp: number,
): number {
  const f = clamp(floor, 0, 0.999);
  const e = exp > 0 ? exp : 1;
  if (
    openedAtMs == null ||
    closesAtMs == null ||
    closesAtMs <= openedAtMs
  ) {
    return 1;
  }
  const span = closesAtMs - openedAtMs;
  const remaining = clamp((closesAtMs - nowMs) / span, 0, 1);
  return f + (1 - f) * remaining ** e;
}

/** 掛け算: 時間だけでは 0 まで落とさず、票が十分なら 0 まで落とせる */
export function wCombined(wT: number, wV: number): number {
  return wT * wV;
}

/** Strength 比で仮想の初期投票額の合計 S を配る（単勝 Seed のみ） */
export function allocateSeed(strengths: number[], seedPoolS: number): number[] {
  const positive = strengths.map((s) => Math.max(0, s));
  const sum = positive.reduce((a, b) => a + b, 0);
  if (!(seedPoolS > 0) || !(sum > 0)) {
    return positive.map(() => 0);
  }
  return positive.map((s) => (seedPoolS * s) / sum);
}

/** パリミュチュエル。share が 0 なら払えない */
export function parimutuelOdds(
  share: number,
  poolTotal: number,
  takeoutD: number,
): number | null {
  if (!(share > 0) || !(poolTotal > 0)) return null;
  const d = clamp(takeoutD, 0, 0.99);
  return (poolTotal * (1 - d)) / share;
}

export function displayPool(seed: number, w: number, real: number, imputed = 0): number {
  return seed * w + real + imputed;
}

/** 連勝1票を単勝参考用に割り振る（λ 済みの額）。返還済みは呼ばない側で除く */
export function addImputed(
  kind: BetKind,
  amount: number,
  horse1: string,
  horse2: string | null,
  horse3: string | null,
  lambda: number,
  into: Map<string, number>,
): void {
  if (kind === "win" || !(amount > 0) || !(lambda > 0)) return;
  const a = amount * lambda;
  const add = (id: string | null, n: number) => {
    if (!id || !(n > 0)) return;
    into.set(id, (into.get(id) ?? 0) + n);
  };
  if (kind === "umaren") {
    add(horse1, a / 2);
    add(horse2, a / 2);
  } else if (kind === "umatan") {
    add(horse1, (a * 2) / 3);
    add(horse2, a / 3);
  } else if (kind === "sanrenpuku") {
    add(horse1, a / 3);
    add(horse2, a / 3);
    add(horse3, a / 3);
  } else if (kind === "sanrentan") {
    add(horse1, a / 2);
    add(horse2, a / 3);
    add(horse3, a / 6);
  }
}

export function referenceTv(winTotal: number, exoticTotal: number, lambda: number): number {
  return winTotal + lambda * exoticTotal;
}

/**
 * 連勝の1買い目に配る確率。順不同は成立しうる並びをすべて加算する。
 * strengths は出走順、selection はその配列の添字で渡す。
 */
export function exoticSelectionProbability(
  kind: Exclude<BetKind, "win">,
  strengths: readonly number[],
  selection: readonly number[],
  gamma = EXOTIC_GAMMA,
  strengthFloor = 0,
): number | null {
  const need = kind === "umaren" || kind === "umatan" ? 2 : 3;
  if (selection.length !== need || new Set(selection).size !== need) return null;
  if (selection.some((index) => index < 0 || index >= strengths.length)) return null;
  const floor = strengthFloor > 0 ? strengthFloor : 0;
  const weighted = strengths.map((strength) =>
    Math.max(floor, Math.max(0, strength)) ** gamma,
  );
  const total = weighted.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return null;
  const q = weighted.map((value) => value / total);
  const orderedProbability = (order: readonly number[]) => {
    let remaining = 1;
    let probability = 1;
    for (const index of order) {
      if (!(remaining > 0) || !(q[index]! >= 0)) return 0;
      probability *= q[index]! / remaining;
      remaining -= q[index]!;
    }
    return probability;
  };
  if (kind === "umatan" || kind === "sanrentan") {
    return orderedProbability(selection);
  }
  if (selection.length === 2) {
    return orderedProbability(selection) + orderedProbability([selection[1]!, selection[0]!]);
  }
  let probability = 0;
  for (let a = 0; a < 3; a += 1) {
    for (let b = 0; b < 3; b += 1) {
      if (b === a) continue;
      const c = [0, 1, 2].find((index) => index !== a && index !== b)!;
      probability += orderedProbability([selection[a]!, selection[b]!, selection[c]!]);
    }
  }
  return probability;
}

/** 投票中の連勝 Seed 参考オッズ。確定配当には使わない。 */
export function exoticReferenceOdds(opts: {
  kind: Exclude<BetKind, "win">;
  strengths: readonly number[];
  selection: readonly number[];
  seedPool: number;
  timeWeight: number;
  realTotal: number;
  selectionReal: number;
  takeoutD: number;
}): number | null {
  return exoticReferenceQuote(opts)?.odds ?? null;
}

export type ExoticReferenceQuote = {
  probability: number;
  seed: number;
  weight: number;
  display: number;
  displayTotal: number;
  odds: number | null;
};

/** 分析ログでも画面と同じ中間値を保存できる連勝参考オッズの内訳。 */
export function exoticReferenceQuote(opts: {
  kind: Exclude<BetKind, "win">;
  strengths: readonly number[];
  selection: readonly number[];
  seedPool: number;
  timeWeight: number;
  realTotal: number;
  selectionReal: number;
  takeoutD: number;
}): ExoticReferenceQuote | null {
  const probability = exoticSelectionProbability(
    opts.kind,
    opts.strengths,
    opts.selection,
    EXOTIC_GAMMA,
    EXOTIC_STRENGTH_FLOOR,
  );
  if (probability == null) return null;
  const volumeWeight = wVolume(opts.realTotal, EXOTIC_PULL_E[opts.kind]);
  const weight = opts.timeWeight * volumeWeight;
  const seed = opts.seedPool * probability;
  const display = seed * weight + opts.selectionReal;
  const displayTotal = opts.seedPool * weight + opts.realTotal;
  return {
    probability,
    seed,
    weight,
    display,
    displayTotal,
    odds: parimutuelOdds(display, displayTotal, opts.takeoutD),
  };
}

export type ExoticOddsQuote = {
  probability: number;
  seed: number;
  share: number;
  pool: number;
  odds: number | null;
};

/** odds-v4 の連勝オッズ。評価点下限も w も掛けない。投票中と確定で同じ。 */
export function exoticOddsQuote(opts: {
  kind: Exclude<BetKind, "win">;
  strengths: readonly number[];
  selection: readonly number[];
  seedPool: number;
  realTotal: number;
  selectionReal: number;
  takeoutD: number;
}): ExoticOddsQuote | null {
  const probability = exoticSelectionProbability(opts.kind, opts.strengths, opts.selection);
  if (probability == null) return null;
  const seed = opts.seedPool * probability;
  const share = seed + Math.max(0, opts.selectionReal);
  const pool = opts.seedPool + Math.max(0, opts.realTotal);
  return {
    probability,
    seed,
    share,
    pool,
    odds: parimutuelOdds(share, pool, opts.takeoutD),
  };
}

/** 整数ポイントへ切り捨て（払戻） */
export function payoutAmount(stake: number, odds: number): number {
  if (!(stake > 0) || !(odds > 0)) return 0;
  return Math.floor(stake * odds);
}

/** 特払い B: 100 スペ → 80 スペ（D 後、端数切り捨て） */
export function specialPayoutAmount(stake: number, takeoutD: number): number {
  if (!(stake > 0)) return 0;
  const d = clamp(takeoutD, 0, 0.99);
  return Math.floor(stake * (1 - d));
}
