/**
 * ウマ柱の見た目専用。ウマ番と頭数から JRA と同じ枠番（1〜8）を出す。
 * 保存しない。メンバー画面では使わない。
 */
export function wakuOf(umaban: number, n: number): number {
  if (n <= 8) return umaban;
  const per = [1, 1, 1, 1, 1, 1, 1, 1];
  let remain = Math.min(n, 16) - 8;
  for (let f = 7; f >= 0 && remain > 0; f--) {
    per[f] += 1;
    remain -= 1;
  }
  if (n >= 17) per[6] += 1;
  if (n >= 18) per[7] += 1;
  let horse = 1;
  for (let f = 0; f < 8; f++) {
    if (umaban < horse + per[f]) return f + 1;
    horse += per[f];
  }
  return 8;
}
