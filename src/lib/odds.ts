/**
 * 参考オッズと確定配当（試運転: docs/09-trial-run.md）
 *
 * 単勝投票中: Display = Seed×w + Real（参考のみ）
 * 確定・連勝: Real のみ。払いの約束①。不成立は特払い B。
 */

export const DEFAULTS = {
  grantG: 3000,
  betUnit: 100,
  typicalBet: 700,
  seedPoolS: 20000,
  pullE: 20000,
  takeoutD: 0.2,
  /** 時間側の下限。時計だけでは 0 にしない（厚め） */
  wTimeFloor: 0.5,
  wTimeExp: 1,
} as const;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 票量側 w。下限 0。E の半分でだいたい半分。TV は単勝実票合計 */
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

export function displayPool(seed: number, w: number, real: number): number {
  return seed * w + real;
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
