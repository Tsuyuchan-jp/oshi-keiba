/**
 * 場の会計。公開時に確定した開催精算と、場全体のスペ総量を読む。
 */

import type { EventSettlementRow, TreasuryDashboard } from "./storeTypes";

type AmountRow = { amount: number };

export const SYSTEM_ADMIN_USER_ID = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";

async function amount(db: D1Database, sql: string, ...binds: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...binds).first<AmountRow>();
  return Number(row?.amount ?? 0);
}

export async function loadTreasuryDashboard(
  db: D1Database,
  currentEventId: string,
  adminUserId: string,
): Promise<TreasuryDashboard> {
  const [adminBalance, memberBalanceTotal, unsettledPoolTotal, currentBetTotal, currentPayoutTotal, currentSettlement, rows] = await Promise.all([
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
    amount(db, "SELECT COALESCE(SUM(amount), 0) AS amount FROM bets WHERE event_id = ?", currentEventId),
    amount(db, "SELECT COALESCE(SUM(amount), 0) AS amount FROM payouts WHERE event_id = ?", currentEventId),
    db.prepare("SELECT retained_amount AS amount FROM event_settlements WHERE event_id = ?")
      .bind(currentEventId).first<AmountRow>(),
    db.prepare(
      `SELECT s.event_id, e.title AS event_title, s.bet_total, s.payout_total,
              s.retained_amount, s.settled_at, s.source
       FROM event_settlements s
       JOIN events e ON e.id = s.event_id
       ORDER BY s.settled_at DESC, e.created_at DESC`,
    ).all<EventSettlementRow>(),
  ]);
  return {
    adminBalance,
    memberBalanceTotal,
    unsettledPoolTotal,
    totalIssued: adminBalance + memberBalanceTotal + unsettledPoolTotal,
    currentBetTotal,
    currentPayoutTotal,
    currentRetainedAmount: currentSettlement ? Number(currentSettlement.amount) : null,
    settlements: rows.results ?? [],
  };
}
