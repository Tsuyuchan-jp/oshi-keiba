/**
 * 試運転の賭式・買い目キー（docs/09-trial-run.md）
 * 当選キーは常に1つ。馬連・3連複は番号をソート。
 */

export type BetKind =
  | "win"
  | "umaren"
  | "umatan"
  | "sanrenpuku"
  | "sanrentan";

export const BET_KINDS: BetKind[] = [
  "win",
  "umaren",
  "umatan",
  "sanrenpuku",
  "sanrentan",
];

export const BET_KIND_LABEL: Record<BetKind, string> = {
  win: "単勝",
  umaren: "馬連",
  umatan: "馬単",
  sanrenpuku: "3連複",
  sanrentan: "3連単",
};

export function isBetKind(s: string): s is BetKind {
  return (BET_KINDS as string[]).includes(s);
}

/** 馬連・3連複はソート、馬単・3連単は順序維持 */
export function normalizeSelection(
  kind: BetKind,
  horseIds: string[],
): { horse_1: string; horse_2: string | null; horse_3: string | null; selection_key: string } {
  const uniq = [...horseIds];
  if (new Set(uniq).size !== uniq.length) {
    throw new Error("同じウマ娘を二度選べません");
  }
  const need =
    kind === "win" ? 1 : kind === "umaren" || kind === "umatan" ? 2 : 3;
  if (uniq.length !== need) {
    throw new Error("買い目の頭数が合いません");
  }
  if (kind === "win") {
    return {
      horse_1: uniq[0],
      horse_2: null,
      horse_3: null,
      selection_key: uniq[0],
    };
  }
  if (kind === "umaren") {
    const [a, b] = [...uniq].sort();
    return {
      horse_1: a,
      horse_2: b,
      horse_3: null,
      selection_key: `${a}-${b}`,
    };
  }
  if (kind === "umatan") {
    return {
      horse_1: uniq[0],
      horse_2: uniq[1],
      horse_3: null,
      selection_key: `${uniq[0]}>${uniq[1]}`,
    };
  }
  if (kind === "sanrenpuku") {
    const [a, b, c] = [...uniq].sort();
    return {
      horse_1: a,
      horse_2: b,
      horse_3: c,
      selection_key: `${a}-${b}-${c}`,
    };
  }
  return {
    horse_1: uniq[0],
    horse_2: uniq[1],
    horse_3: uniq[2],
    selection_key: `${uniq[0]}>${uniq[1]}>${uniq[2]}`,
  };
}

export function betIncludesHorse(
  horse_1: string,
  horse_2: string | null,
  horse_3: string | null,
  horseId: string,
): boolean {
  return horse_1 === horseId || horse_2 === horseId || horse_3 === horseId;
}

/** 着順から当選キー。着順が揃っていない賭式は null */
export function winningKey(
  kind: BetKind,
  horses: { id: string; finish_place: number | null; scratched: number }[],
): string | null {
  const live = horses.filter((h) => !h.scratched);
  const byPlace = new Map<number, string>();
  for (const h of live) {
    if (h.finish_place == null) return null;
    byPlace.set(h.finish_place, h.id);
  }
  const p1 = byPlace.get(1);
  const p2 = byPlace.get(2);
  const p3 = byPlace.get(3);
  if (!p1) return null;
  if (kind === "win") return p1;
  if (!p2) return null;
  if (kind === "umaren") {
    return normalizeSelection("umaren", [p1, p2]).selection_key;
  }
  if (kind === "umatan") {
    return normalizeSelection("umatan", [p1, p2]).selection_key;
  }
  if (!p3) return null;
  if (kind === "sanrenpuku") {
    return normalizeSelection("sanrenpuku", [p1, p2, p3]).selection_key;
  }
  return normalizeSelection("sanrentan", [p1, p2, p3]).selection_key;
}

/** 表示用: 通し番号の並び（名簿順）。内部キーは id */
export function formatSelectionLabel(
  kind: BetKind,
  horse_1: string,
  horse_2: string | null,
  horse_3: string | null,
  numberById: Map<string, number>,
): string {
  const n = (id: string | null) =>
    id == null ? "?" : String(numberById.get(id) ?? "?");
  if (kind === "win") return n(horse_1);
  if (kind === "umaren") return `${n(horse_1)}-${n(horse_2)}`;
  if (kind === "umatan") return `${n(horse_1)}→${n(horse_2)}`;
  if (kind === "sanrenpuku") return `${n(horse_1)}-${n(horse_2)}-${n(horse_3)}`;
  return `${n(horse_1)}→${n(horse_2)}→${n(horse_3)}`;
}

export type BetPayout = { kind: string; amount: number };

/** 管理の全投票一覧用。公開後の結果・確定配当・メンバー目線の収支 */
export function settleBet(opts: {
  amount: number;
  refunded: boolean;
  status: "setup" | "voting" | "closed" | "published";
  payout: BetPayout | null;
  comboOdds: number | null;
  kindVoid: boolean | null;
}): { result: string; odds: number | null; move: number } {
  const stake = opts.amount;
  const pk = opts.payout?.kind ?? "";
  if (pk === "refund" || pk === "redo" || pk === "void") {
    return { result: "返還", odds: null, move: 0 };
  }
  if (pk === "special") {
    return {
      result: "特払い",
      odds: null,
      move: (opts.payout?.amount ?? 0) - stake,
    };
  }
  if (pk === "win") {
    return {
      result: "的中",
      odds: opts.comboOdds,
      move: (opts.payout?.amount ?? 0) - stake,
    };
  }
  if (opts.refunded) {
    return { result: "返還", odds: null, move: 0 };
  }
  if (opts.status === "published") {
    return { result: "はずれ", odds: opts.comboOdds, move: -stake };
  }
  if (opts.status === "closed") {
    if (opts.kindVoid) {
      return { result: "特払い予定", odds: null, move: -stake };
    }
    return { result: "締切", odds: opts.comboOdds, move: -stake };
  }
  return { result: "投票中", odds: null, move: -stake };
}
