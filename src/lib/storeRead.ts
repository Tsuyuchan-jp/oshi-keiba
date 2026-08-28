/**
 * store 読み取り（出走・票・会員・正規化）
 */

import { isBetKind, type BetKind } from "./bets";
import { composeHorseName, horseSheetParts } from "./horseName";
import type { BetRow, HorseRow, UserRow } from "./storeTypes";

export function hydrateHorseRow(row: HorseRow): HorseRow {
  const parts = horseSheetParts(row);
  return {
    ...row,
    uma_name: parts.umaName,
    runner_name: parts.runnerName,
    shot_key: row.shot_key ?? null,
    chara_id: row.chara_id ?? null,
    dress_id: row.dress_id ?? null,
    score_input: row.score_input ?? null,
    name: composeHorseName(parts.umaName, parts.runnerName) || row.name,
  };
}

export function normalizeBetRow(raw: Record<string, unknown>): BetRow {
  const horseId = String(raw.horse_id ?? "");
  const kindRaw = String(raw.kind ?? "win");
  const kind: BetKind = isBetKind(kindRaw) ? kindRaw : "win";
  const horse_1 = String(raw.horse_1 ?? horseId);
  const horse_2 =
    raw.horse_2 == null || raw.horse_2 === "" ? null : String(raw.horse_2);
  const horse_3 =
    raw.horse_3 == null || raw.horse_3 === "" ? null : String(raw.horse_3);
  const selection_key = String(
    raw.selection_key ?? (kind === "win" ? horse_1 : ""),
  );
  return {
    id: String(raw.id),
    event_id: String(raw.event_id),
    user_id: String(raw.user_id),
    horse_id: horseId || horse_1,
    kind,
    selection_key,
    horse_1,
    horse_2,
    horse_3,
    amount: Number(raw.amount),
    refunded: Number(raw.refunded),
    created_at: Number(raw.created_at),
  };
}

export async function listHorses(
  db: D1Database,
  eventId: string,
): Promise<HorseRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM horses WHERE event_id = ? ORDER BY sort_order, created_at")
    .bind(eventId)
    .all<HorseRow>();
  return (results ?? []).map(hydrateHorseRow);
}

export async function listActiveBets(
  db: D1Database,
  eventId: string,
): Promise<BetRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM bets WHERE event_id = ? AND refunded = 0")
    .bind(eventId)
    .all();
  return (results ?? []).map((r) => normalizeBetRow(r as Record<string, unknown>));
}

export async function listAllBets(
  db: D1Database,
  eventId: string,
  order: "new" | "name",
): Promise<(BetRow & { display_name: string })[]> {
  const sql =
    order === "name"
      ? `SELECT b.*, u.display_name FROM bets b
         JOIN users u ON u.id = b.user_id
         WHERE b.event_id = ?
         ORDER BY u.display_name COLLATE NOCASE, b.created_at DESC`
      : `SELECT b.*, u.display_name FROM bets b
         JOIN users u ON u.id = b.user_id
         WHERE b.event_id = ?
         ORDER BY b.created_at DESC`;
  const { results } = await db.prepare(sql).bind(eventId).all();
  return (results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...normalizeBetRow(row),
      display_name: String(row.display_name),
    };
  });
}

export async function listMembers(db: D1Database): Promise<UserRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM users WHERE role = 'member' ORDER BY display_name COLLATE NOCASE",
    )
    .all<UserRow>();
  return results ?? [];
}

export async function getUser(
  db: D1Database,
  userId: string,
): Promise<UserRow | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
}

export async function hasJoinedEvent(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT user_id FROM grants WHERE event_id = ? AND user_id = ?")
    .bind(eventId, userId)
    .first();
  return !!row;
}

export async function listUserBets(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<BetRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM bets WHERE event_id = ? AND user_id = ? ORDER BY created_at",
    )
    .bind(eventId, userId)
    .all();
  return (results ?? []).map((r) => normalizeBetRow(r as Record<string, unknown>));
}

export async function listUserPayouts(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<{ bet_id: string; amount: number; kind: string }[]> {
  const { results } = await db
    .prepare(
      "SELECT bet_id, amount, kind FROM payouts WHERE event_id = ? AND user_id = ?",
    )
    .bind(eventId, userId)
    .all<{ bet_id: string; amount: number; kind: string }>();
  return results ?? [];
}

export async function listEventPayouts(
  db: D1Database,
  eventId: string,
): Promise<{ bet_id: string; amount: number; kind: string }[]> {
  const { results } = await db
    .prepare("SELECT bet_id, amount, kind FROM payouts WHERE event_id = ?")
    .bind(eventId)
    .all<{ bet_id: string; amount: number; kind: string }>();
  return results ?? [];
}
