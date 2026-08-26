/**
 * store 進行（投票開始〜締切・投票・着順・公開・取消）
 */

import {
  betIncludesHorse,
  kindIsEnabled,
  normalizeSelection,
  type BetKind,
} from "./bets";
import { newId } from "./auth";
import { clawbackBalance } from "./lifecycle";
import {
  parimutuelOdds,
  payoutAmount,
  specialPayoutAmount,
} from "./odds";
import { captureAdminUndo } from "./undo";
import { buildBoard } from "./storeBoard";
import {
  getUser,
  hasJoinedEvent,
  hydrateHorseRow,
  listActiveBets,
  listHorses,
  normalizeBetRow,
} from "./storeRead";
import {
  MAX_LIVE_HORSES,
  MIN_LIVE_HORSES,
  type EventRow,
  type HorseRow,
  type UserRow,
} from "./storeTypes";

export async function openVoting(
  db: D1Database,
  event: EventRow,
  closesAtMs: number | null,
): Promise<void> {
  if (event.status !== "setup") throw new Error("投票開始できるのはセットアップ中だけです");
  const horses = await listHorses(db, event.id);
  const live = horses.filter((h) => h.scratched === 0);
  if (live.length < MIN_LIVE_HORSES || live.length > MAX_LIVE_HORSES) {
    throw new Error(
      `投票開始には取消前の頭数が ${MIN_LIVE_HORSES}〜${MAX_LIVE_HORSES} 必要です`,
    );
  }
  await captureAdminUndo(db, "投票開始");
  const now = Date.now();
  await db
    .prepare(
      `UPDATE events SET status = 'voting', voting_opened_at = ?, voting_closes_at = ? WHERE id = ?`,
    )
    .bind(now, closesAtMs, event.id)
    .run();
}

export async function forceClose(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "voting") throw new Error("締切できるのは投票中だけです");
  await captureAdminUndo(db, "強制締切");
  const now = Date.now();
  await db
    .prepare(
      "UPDATE events SET status = 'closed', closed_at = ? WHERE id = ?",
    )
    .bind(now, event.id)
    .run();
}

export async function placeBet(
  db: D1Database,
  event: EventRow,
  user: UserRow,
  kind: BetKind,
  horseIds: string[],
  amount: number,
): Promise<{ selection_key: string }> {
  if (event.status !== "voting") throw new Error("投票期間外です");
  if (!(await hasJoinedEvent(db, event.id, user.id))) {
    throw new Error("この開催にはまだ参加していません");
  }
  if (!kindIsEnabled(event.enabled_kinds, kind)) {
    throw new Error("この賭式は今回のレースでは使えません");
  }
  if (!Number.isFinite(amount) || amount < event.bet_unit || amount % event.bet_unit !== 0) {
    throw new Error(`最低単位は ${event.bet_unit} です`);
  }
  const sel = normalizeSelection(kind, horseIds);
  const ids = [sel.horse_1, sel.horse_2, sel.horse_3].filter(Boolean) as string[];
  for (const hid of ids) {
    const horse = await db
      .prepare("SELECT * FROM horses WHERE id = ? AND event_id = ?")
      .bind(hid, event.id)
      .first<HorseRow>();
    if (!horse || horse.scratched) throw new Error("このウマ娘には投票できません");
  }
  const fresh = await getUser(db, user.id);
  if (!fresh) throw new Error("ユーザーが見つかりません");
  if (amount > fresh.balance) throw new Error("残高が足りません");
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO bets (
          id, event_id, user_id, horse_id, kind, selection_key,
          horse_1, horse_2, horse_3, amount, refunded, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        newId(),
        event.id,
        user.id,
        sel.horse_1,
        kind,
        sel.selection_key,
        sel.horse_1,
        sel.horse_2,
        sel.horse_3,
        amount,
        now,
      ),
    db
      .prepare("UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?")
      .bind(amount, user.id, amount),
  ]);
  return { selection_key: sel.selection_key };
}

/** やりなおし: 自分の未返還票を全取消し、残高に戻す */
export async function redoMyBets(
  db: D1Database,
  event: EventRow,
  user: UserRow,
): Promise<number> {
  if (event.status !== "voting") throw new Error("やりなおしは投票中だけです");
  if (!(await hasJoinedEvent(db, event.id, user.id))) {
    throw new Error("この開催にはまだ参加していません");
  }
  const { results } = await db
    .prepare(
      "SELECT * FROM bets WHERE event_id = ? AND user_id = ? AND refunded = 0",
    )
    .bind(event.id, user.id)
    .all();
  const bets = (results ?? []).map((r) =>
    normalizeBetRow(r as Record<string, unknown>),
  );
  if (bets.length === 0) throw new Error("取り消す馬券がありません");
  const now = Date.now();
  const stmts = [];
  let total = 0;
  for (const b of bets) {
    total += b.amount;
    stmts.push(
      db.prepare("UPDATE bets SET refunded = 1 WHERE id = ?").bind(b.id),
      db
        .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
        .bind(b.amount, b.user_id),
      db
        .prepare(
          "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'redo', ?)",
        )
        .bind(newId(), event.id, b.user_id, b.id, b.amount, now),
    );
  }
  await db.batch(stmts);
  return total;
}

export async function scratchHorse(
  db: D1Database,
  event: EventRow,
  horseId: string,
): Promise<number> {
  if (event.status === "published") {
    throw new Error("公開後は取消できません");
  }
  const horse = await db
    .prepare("SELECT * FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first<HorseRow>();
  if (!horse) throw new Error("出走が見つかりません");
  const labeled = hydrateHorseRow(horse);
  if (labeled.scratched) return 0;
  await captureAdminUndo(db, `出走取消（${labeled.name}）`);
  const { results } = await db
    .prepare("SELECT * FROM bets WHERE event_id = ? AND refunded = 0")
    .bind(event.id)
    .all();
  const allBets = (results ?? []).map((r) =>
    normalizeBetRow(r as Record<string, unknown>),
  );
  const bets = allBets.filter((b) =>
    betIncludesHorse(b.horse_1, b.horse_2, b.horse_3, horseId),
  );
  const stmts = [
    db
      .prepare(
        "UPDATE horses SET scratched = 1, finish_place = NULL WHERE id = ?",
      )
      .bind(horseId),
  ];
  const now = Date.now();
  for (const b of bets) {
    stmts.push(
      db.prepare("UPDATE bets SET refunded = 1 WHERE id = ?").bind(b.id),
      db
        .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
        .bind(b.amount, b.user_id),
      db
        .prepare(
          "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'refund', ?)",
        )
        .bind(newId(), event.id, b.user_id, b.id, b.amount, now),
    );
  }
  await db.batch(stmts);
  return bets.reduce((a, b) => a + b.amount, 0);
}

export async function savePlaces(
  db: D1Database,
  event: EventRow,
  places: { horseId: string; place: number }[],
): Promise<void> {
  if (event.status !== "closed") {
    throw new Error("着順入力は馬券締切後、公開前だけです");
  }
  const horses = (await listHorses(db, event.id)).filter((h) => h.scratched === 0);
  if (places.length !== horses.length) {
    throw new Error("取消していない頭の着順をすべて入れてください");
  }
  const ids = new Set(horses.map((h) => h.id));
  const seenPlace = new Set<number>();
  for (const p of places) {
    if (!ids.has(p.horseId)) throw new Error("名簿外の着順は入れられません");
    if (p.place < 1 || p.place > horses.length) {
      throw new Error("着順の値が範囲外です");
    }
    if (seenPlace.has(p.place)) throw new Error("着順が重複しています");
    seenPlace.add(p.place);
  }
  await captureAdminUndo(db, "着順を保存");
  const stmts = places.map((p) =>
    db
      .prepare("UPDATE horses SET finish_place = ? WHERE id = ?")
      .bind(p.place, p.horseId),
  );
  await db.batch(stmts);
}

export async function publishResults(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "closed") throw new Error("公開できるのは締切後だけです");
  if (event.payouts_applied) {
    await db
      .prepare(
        "UPDATE events SET status = 'published', published_at = ? WHERE id = ?",
      )
      .bind(Date.now(), event.id)
      .run();
    return;
  }
  const horses = await listHorses(db, event.id);
  const live = horses.filter((h) => h.scratched === 0);
  if (live.some((h) => h.finish_place == null)) {
    throw new Error("着順が入っていない頭があります");
  }
  await captureAdminUndo(db, "結果公開・払戻");
  const bets = await listActiveBets(db, event.id);
  const board = buildBoard(event, horses, bets);
  const now = Date.now();
  const stmts = [];

  for (const pool of board.pools) {
    const kindBets = bets.filter((b) => b.kind === pool.kind);
    if (kindBets.length === 0) continue;
    if (pool.voidSpecial) {
      for (const b of kindBets) {
        const pay = specialPayoutAmount(b.amount, event.takeout_d);
        stmts.push(
          db.prepare("UPDATE bets SET refunded = 1 WHERE id = ?").bind(b.id),
          db
            .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
            .bind(pay, b.user_id),
          db
            .prepare(
              "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'special', ?)",
            )
            .bind(newId(), event.id, b.user_id, b.id, pay, now),
        );
      }
      continue;
    }
    const winKey = pool.winningKey;
    if (!winKey) throw new Error(`${pool.kind} の当選キーがありません`);
    const winnerReal = pool.combos.find((c) => c.selection_key === winKey)?.real ?? 0;
    const odds = parimutuelOdds(winnerReal, pool.realTotal, event.takeout_d);
    if (odds == null) throw new Error(`${pool.kind} の確定配当を計算できません`);
    for (const b of kindBets) {
      if (b.selection_key !== winKey) continue;
      const pay = payoutAmount(b.amount, odds);
      stmts.push(
        db
          .prepare(
            "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'win', ?)",
          )
          .bind(newId(), event.id, b.user_id, b.id, pay, now),
        db
          .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
          .bind(pay, b.user_id),
      );
    }
  }

  stmts.push(
    db
      .prepare(
        "UPDATE events SET status = 'published', published_at = ?, payouts_applied = 1 WHERE id = ?",
      )
      .bind(now, event.id),
  );
  await db.batch(stmts);
}

/** 投票中を setup に戻す。票は全額返還。この開催の G は巻き戻す */
export async function revertVotingToSetup(
  db: D1Database,
  event: EventRow,
): Promise<void> {
  if (event.status !== "voting") {
    throw new Error("戻せるのは投票中だけです");
  }
  await captureAdminUndo(db, "投票を取り消して登録に戻す");
  const now = Date.now();
  const { results: betRows } = await db
    .prepare("SELECT * FROM bets WHERE event_id = ? AND refunded = 0")
    .bind(event.id)
    .all();
  const bets = (betRows ?? []).map((r) =>
    normalizeBetRow(r as Record<string, unknown>),
  );
  const stmts = [];
  for (const b of bets) {
    stmts.push(
      db.prepare("UPDATE bets SET refunded = 1 WHERE id = ?").bind(b.id),
      db
        .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
        .bind(b.amount, b.user_id),
      db
        .prepare(
          "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'redo', ?)",
        )
        .bind(newId(), event.id, b.user_id, b.id, b.amount, now),
    );
  }
  if (stmts.length) {
    for (let i = 0; i < stmts.length; i += 40) {
      await db.batch(stmts.slice(i, i + 40));
    }
  }
  const { results: grantRows } = await db
    .prepare("SELECT user_id, amount FROM grants WHERE event_id = ?")
    .bind(event.id)
    .all<{ user_id: string; amount: number }>();
  for (const g of grantRows ?? []) {
    const u = await getUser(db, g.user_id);
    if (!u) continue;
    const next = clawbackBalance(u.balance, g.amount);
    await db
      .prepare("UPDATE users SET balance = ? WHERE id = ?")
      .bind(next, u.id)
      .run();
  }
  await db.prepare("DELETE FROM grants WHERE event_id = ?").bind(event.id).run();
  await db
    .prepare(
      "UPDATE events SET status = 'setup', voting_opened_at = NULL, closed_at = NULL WHERE id = ?",
    )
    .bind(event.id)
    .run();
}
