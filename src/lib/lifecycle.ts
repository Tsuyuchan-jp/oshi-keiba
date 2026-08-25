/** 参加ボタン。タイトルが空なら汎用 */
export function joinButtonLabel(title: string): string {
  const t = title.trim();
  return t ? `${t}に参加する` : "今回レースに参加する";
}

/** G 巻き戻し後の残高。持ち越しは残す。足りなければ 0 */
export function clawbackBalance(balance: number, grantAmount: number): number {
  if (!(grantAmount > 0)) return Math.max(0, balance);
  return Math.max(0, balance - grantAmount);
}
