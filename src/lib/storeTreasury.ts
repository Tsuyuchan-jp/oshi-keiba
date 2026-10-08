/**
 * 場の会計。公開時に確定した開催精算と、場全体のスペ総量を読む。
 */

import type { EventSettlementRow, TreasuryDashboard } from "./storeTypes";

type AmountRow = { amount: number };
type EventAmountRow = { event_id: string; amount: number };
type EventKindAmountRow = { event_id: string; kind: string; amount: number };

export const SYSTEM_ADMIN_USER_ID = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";

export type EventMoneyBreakdown = {
  betTotal: number;
  prizePayoutTotal: number;
  redoTotal: number;
  scratchRefundTotal: number;
  effectiveBetTotal: number;
};

function emptyBreakdown(): EventMoneyBreakdown {
  return {
    betTotal: 0,
    prizePayoutTotal: 0,
    redoTotal: 0,
    scratchRefundTotal: 0,
    effectiveBetTotal: 0,
  };
}

export function breakdownFromSums(
  betTotal: number,
  prizePayoutTotal: number,
  redoTotal: number,
  scratchRefundTotal: number,
): EventMoneyBreakdown {
  const bet = Number(betTotal) || 0;
  const prize = Number(prizePayoutTotal) || 0;
  const redo = Number(redoTotal) || 0;
  const scratch = Number(scratchRefundTotal) || 0;
  return {
    betTotal: bet,
    prizePayoutTotal: prize,
    redoTotal: redo,
    scratchRefundTotal: scratch,
    effectiveBetTotal: bet - redo - scratch,
  };
}

async function amount(db: D1Database, sql: string, ...binds: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...binds).first<AmountRow>();
  return Number(row?.amount ?? 0);
}

function breakdownMap(
  betRows: EventAmountRow[],
  payoutRows: EventKindAmountRow[],
): Map<string, EventMoneyBreakdown> {
  const bets = new Map<string, number>();
  for (const r of betRows) bets.set(r.event_id, Number(r.amount) || 0);
  const prize = new Map<string, number>();
  const redo = new Map<string, number>();
  const scratch = new Map<string, number>();
  for (const r of payoutRows) {
    const n = Number(r.amount) || 0;
    if (r.kind === "win" || r.kind === "special") {
      prize.set(r.event_id, (prize.get(r.event_id) ?? 0) + n);
    } else if (r.kind === "redo") {
      redo.set(r.event_id, (redo.get(r.event_id) ?? 0) + n);
    } else if (r.kind === "refund") {
      scratch.set(r.event_id, (scratch.get(r.event_id) ?? 0) + n);
    }
  }
  const ids = new Set([...bets.keys(), ...prize.keys(), ...redo.keys(), ...scratch.keys()]);
  const out = new Map<string, EventMoneyBreakdown>();
  for (const id of ids) {
    out.set(
      id,
      breakdownFromSums(
        bets.get(id) ?? 0,
        prize.get(id) ?? 0,
        redo.get(id) ?? 0,
        scratch.get(id) ?? 0,
      ),
    );
  }
  return out;
}

export async function loadTreasuryDashboard(
  db: D1Database,
  currentEventId: string,
  adminUserId: string,
): Promise<TreasuryDashboard> {
  const [
    adminBalance,
    memberBalanceTotal,
    unsettledPoolTotal,
    currentSettlement,
    settlementRows,
    betSums,
    payoutSums,
  ] = await Promise.all([
    amount(db, "SELECT COALESCE(balance, 0) AS amount FROM users WHERE id = ? AND role = 'admin'", adminUserId),
    amount(db, "SELECT COALESCE(SUM(balance), 0) AS amount FROM users WHERE role = 'member'"),
    amount(
      db,
      `SELECT COALESCE(SUM(
         (SELECT COALESCE(SUM(b.amount), 0) FROM bets b WHERE b.event_id = e.id)
         - (SELECT COALESCE(SUM(p.amount), 0) FROM payouts p WHERE p.event_id = e.id)
       ), 0) AS amount
       FROM events e
       WHERE NOT EXISTS (SELECT 1 FROM event_settlements s WHERE s.event_id = e.id)`,
    ),
    db.prepare("SELECT retained_amount AS amount FROM event_settlements WHERE event_id = ?")
      .bind(currentEventId).first<AmountRow>(),
    db.prepare(
      `SELECT s.event_id, e.title AS event_title, s.bet_total, s.payout_total,
              s.retained_amount, s.settled_at, s.source
       FROM event_settlements s
       JOIN events e ON e.id = s.event_id
       ORDER BY s.settled_at DESC, e.created_at DESC`,
    ).all<Omit<EventSettlementRow, "effective_bet_total" | "prize_payout_total" | "redo_total" | "scratch_refund_total">>(),
    db.prepare("SELECT event_id, COALESCE(SUM(amount), 0) AS amount FROM bets GROUP BY event_id")
      .all<EventAmountRow>(),
    db.prepare(
      "SELECT event_id, kind, COALESCE(SUM(amount), 0) AS amount FROM payouts GROUP BY event_id, kind",
    ).all<EventKindAmountRow>(),
  ]);
  const byEvent = breakdownMap(betSums.results ?? [], payoutSums.results ?? []);
  const current = byEvent.get(currentEventId) ?? emptyBreakdown();
  const settlements: EventSettlementRow[] = (settlementRows.results ?? []).map((row) => {
    const b = byEvent.get(row.event_id) ?? emptyBreakdown();
    return {
      ...row,
      effective_bet_total: b.effectiveBetTotal,
      prize_payout_total: b.prizePayoutTotal,
      redo_total: b.redoTotal,
      scratch_refund_total: b.scratchRefundTotal,
    };
  });
  return {
    adminBalance,
    memberBalanceTotal,
    unsettledPoolTotal,
    totalIssued: adminBalance + memberBalanceTotal + unsettledPoolTotal,
    prizePayoutTotal: settlements.reduce((sum, row) => sum + row.prize_payout_total, 0),
    currentBetTotal: current.betTotal,
    currentPayoutTotal: current.prizePayoutTotal + current.redoTotal + current.scratchRefundTotal,
    currentEffectiveBetTotal: current.effectiveBetTotal,
    currentPrizePayoutTotal: current.prizePayoutTotal,
    currentRedoTotal: current.redoTotal,
    currentScratchRefundTotal: current.scratchRefundTotal,
    currentRetainedAmount: currentSettlement ? Number(currentSettlement.amount) : null,
    settlements,
  };
}
