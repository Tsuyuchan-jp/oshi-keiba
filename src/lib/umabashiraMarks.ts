/** 評価点順位の印。新しい確率は計算しない。 */

export const MARK_NONE = "─";

const RANK_MARKS = ["◎", "○", "▲", "△", "△", "△"] as const;

export type MarkHorse = {
  number: number;
  /** 欠け・非数は末尾・無印 */
  strength: number | null;
};

/** 取消除外後の列順（ウマ番順）に対する印。同点はウマ番小が上。 */
export function marksForHorses(horses: readonly MarkHorse[]): string[] {
  const order = horses.map((_, i) => i).sort((a, b) => {
    const sa = horses[a]!.strength;
    const sb = horses[b]!.strength;
    const aMiss = sa == null || !Number.isFinite(sa);
    const bMiss = sb == null || !Number.isFinite(sb);
    if (aMiss !== bMiss) return aMiss ? 1 : -1;
    if (!aMiss && !bMiss && sb !== sa) return sb - sa;
    return horses[a]!.number - horses[b]!.number;
  });
  const out = Array.from({ length: horses.length }, () => MARK_NONE);
  for (const [rank, idx] of order.entries()) {
    const strength = horses[idx]!.strength;
    if (strength == null || !Number.isFinite(strength)) continue;
    out[idx] = RANK_MARKS[rank] ?? MARK_NONE;
  }
  return out;
}
