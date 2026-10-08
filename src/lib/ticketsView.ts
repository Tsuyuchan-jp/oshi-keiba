import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  type BetKind,
} from "./bets.ts";
import { isOddsV4 } from "./odds.ts";
import { numberByHorseId, type BetRow, type Board } from "./store.ts";

export type UserPayout = { bet_id: string; amount: number; kind: string };

export type TicketResult = "pending" | "hit" | "lost" | "special" | "refund";

export type MyTicketView = {
  key: string;
  kind: BetKind;
  kindLabel: string;
  selectionLabel: string;
  horseNames: string[];
  amount: number;
  purchaseCount: number;
  purchasedAt: number;
  confirmedOdds: number | null;
  specialPending: boolean;
  payoutAmount: number;
  result: TicketResult;
};

function confirmedOdds(board: Board, kind: BetKind, selectionKey: string): number | null {
  if (kind === "win") {
    return board.horses.find((entry) => entry.horse.id === selectionKey)?.confirmedOdds ?? null;
  }
  return board.pools
    .find((pool) => pool.kind === kind)
    ?.combos.find((combo) => combo.selection_key === selectionKey)?.odds ?? null;
}

/** 同じ賭式・買い目への有効な購入を、画面上の疑似馬券1枚へまとめる。 */
export function buildMyTickets(
  board: Board,
  bets: BetRow[],
  payouts: UserPayout[],
): MyTicketView[] {
  const payoutByBet = new Map(payouts.map((payout) => [payout.bet_id, payout]));
  const nums = numberByHorseId(board);
  const horseById = new Map(board.horses.map((entry) => [entry.horse.id, entry.horse]));
  const groups = new Map<string, { bets: BetRow[]; payouts: UserPayout[] }>();

  for (const bet of bets) {
    const payout = payoutByBet.get(bet.id);
    // 「やりなおし」は購入自体を取り消した操作なので、馬券棚には残さない。
    if (payout?.kind === "redo") continue;
    if (bet.refunded && !payout) continue;
    const key = `${bet.kind}:${bet.selection_key}`;
    const group = groups.get(key) ?? { bets: [], payouts: [] };
    group.bets.push(bet);
    if (payout) group.payouts.push(payout);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const first = group.bets[0]!;
      const horseIds = [first.horse_1, first.horse_2, first.horse_3]
        .filter((id): id is string => Boolean(id));
      const payoutKinds = new Set(group.payouts.map((payout) => payout.kind));
      const result: TicketResult = payoutKinds.has("refund") || group.bets.every((bet) => Boolean(bet.refunded))
        ? "refund"
        : board.event.status !== "published"
          ? "pending"
          : payoutKinds.has("win")
          ? "hit"
          : payoutKinds.has("special")
            ? "special"
            : "lost";
      return {
        key,
        kind: first.kind,
        kindLabel: BET_KIND_LABEL[first.kind],
        selectionLabel: formatSelectionLabel(
          first.kind,
          first.horse_1,
          first.horse_2,
          first.horse_3,
          nums,
        ),
        horseNames: horseIds.map((id) => horseById.get(id)?.uma_name ?? "不明"),
        amount: group.bets.reduce((sum, bet) => sum + bet.amount, 0),
        purchaseCount: group.bets.length,
        purchasedAt: Math.max(...group.bets.map((bet) => bet.created_at)),
        confirmedOdds: board.event.status === "closed" || board.event.status === "published"
          ? confirmedOdds(board, first.kind, first.selection_key)
          : null,
        specialPending: !isOddsV4(board.event) && board.pools.find((pool) => pool.kind === first.kind)?.voidSpecial === true,
        payoutAmount: group.payouts
          .filter((payout) => payout.kind !== "redo")
          .reduce((sum, payout) => sum + payout.amount, 0),
        result,
      };
    })
    .sort((a, b) => b.purchasedAt - a.purchasedAt);
}

export function ticketSummary(tickets: MyTicketView[]) {
  return {
    count: tickets.length,
    amount: tickets.reduce((sum, ticket) => sum + ticket.amount, 0),
    hitCount: tickets.filter((ticket) => ticket.result === "hit").length,
    payoutAmount: tickets
      .filter((ticket) => ticket.result === "hit")
      .reduce((sum, ticket) => sum + ticket.payoutAmount, 0),
  };
}
