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
import { captureAdminUndo, prepareConditionalAdminUndo } from "./undo";
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
import { parseEnabledKinds } from "./bets";
import { eventScoreSetup } from "./storeEvent";
import { captureAnalysisSnapshot } from "./analysisLog";

/** 投票開始前に満たすべき、画面と API で共通の条件。 */
export function votingStartProblems(
  event: EventRow,
  horses: HorseRow[],
  now = Date.now(),
): string[] {
  const problems: string[] = [];
  const live = horses.filter((h) => h.scratched === 0);
  if (live.length < MIN_LIVE_HORSES || live.length > MAX_LIVE_HORSES) {
    problems.push(`出走頭数を ${MIN_LIVE_HORSES}〜${MAX_LIVE_HORSES} 頭にしてください`);
  }
  if (event.voting_closes_at == null) problems.push("投票締切日時を設定してください");
  else if (event.voting_closes_at <= now) problems.push("投票締切日時を未来に設定してください");
  if (!event.title.trim()) problems.push("開催名を設定してください");
  if (!Number.isInteger(event.grant_g) || event.grant_g < 0) problems.push("配布Gを設定してください");
  if (!Number.isInteger(event.bet_unit) || event.bet_unit < 1) problems.push("馬券単位を設定してください");
  if (!Number.isFinite(event.seed_pool_s) || event.seed_pool_s < 0 ||
      !Number.isFinite(event.pull_e) || event.pull_e < 0 ||
      !Number.isFinite(event.takeout_d) || event.takeout_d < 0 || event.takeout_d > .99 ||
      !Number.isFinite(event.w_time_floor) || event.w_time_floor < 0 || event.w_time_floor > .99 ||
      !Number.isFinite(event.w_time_exp) || event.w_time_exp < .2 || event.w_time_exp > 4) {
    problems.push("オッズ設定を正しく入力してください");
  }
  if (!parseEnabledKinds(event.enabled_kinds).length) problems.push("賭式を1つ以上有効にしてください");

  const setup = eventScoreSetup(event);
  if (!setup) {
    problems.push("レース条件と評価目標を設定してください");
  } else {
    const byStyle = setup.requirements.staminaByStyle;
    const staminaComplete = byStyle && Object.values(byStyle).every((v) =>
      Number.isInteger(v.noTempt) && v.noTempt > 0 &&
      Number.isInteger(v.withTempt) && v.withTempt >= v.noTempt,
    );
    if (!staminaComplete) problems.push("脚質別スタミナ8項目をすべて設定してください");
    if (!setup.staminaRaceSelected) problems.push("スタミナ勝負の有無を選択してください");
  }
  return problems;
}

export async function openVoting(
  db: D1Database,
  event: EventRow,
  closesAtMs: number | null,
): Promise<void> {
  if (event.status !== "setup") throw new Error("投票開始できるのはセットアップ中だけです");
  const horses = await listHorses(db, event.id);
  const problems = votingStartProblems(event, horses);
  if (problems.length) throw new Error(`投票開始できません: ${problems.join(" / ")}`);
  await captureAdminUndo(db, "投票開始");
  const now = Date.now();
  await db
    .prepare(
      `UPDATE events SET status = 'voting', voting_opened_at = ?, voting_closes_at = ? WHERE id = ?`,
    )
    .bind(now, closesAtMs, event.id)
    .run();
  await captureAnalysisSnapshot(db, event.id, "voting_open", now);
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
  await captureAnalysisSnapshot(db, event.id, "close", now);
}

export async function placeBet(
  db: D1Database,
  event: EventRow,
  user: UserRow,
  kind: BetKind,
  horseIds: string[],
  amount: number,
  operationId = newId(),
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
  const requestHash = `bet:${kind}:${sel.selection_key}:${amount}`;
  const existing = await findMemberOperation(db, operationId);
  if (existing) {
    assertOperationMatches(existing, event.id, user.id, "bet", requestHash);
    return { selection_key: sel.selection_key };
  }

  const now = Date.now();
  const betId = newId();
  const horseGuards = ids.map(
    () => `AND EXISTS (SELECT 1 FROM horses WHERE id = ? AND event_id = ? AND scratched = 0)`,
  ).join(" ");
  const horseValues = ids.flatMap((id) => [id, event.id]);
  await db.batch([
    db
      .prepare(
        `UPDATE users SET balance = balance - ?
         WHERE id = ? AND balance >= ?
           AND NOT EXISTS (SELECT 1 FROM member_operations WHERE id = ?)
           AND EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'voting')
           AND EXISTS (SELECT 1 FROM grants WHERE event_id = ? AND user_id = ?)
           ${horseGuards}`,
      )
      .bind(
        amount,
        user.id,
        amount,
        operationId,
        event.id,
        event.id,
        user.id,
        ...horseValues,
      ),
    db
      .prepare(
        `INSERT INTO member_operations (
          id, event_id, user_id, kind, request_hash, result_amount, bet_id, created_at
        ) SELECT ?, ?, ?, 'bet', ?, ?, ?, ? WHERE changes() = 1`,
      )
      .bind(
        operationId,
        event.id,
        user.id,
        requestHash,
        amount,
        betId,
        now,
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO bets (
          id, event_id, user_id, horse_id, kind, selection_key,
          horse_1, horse_2, horse_3, amount, refunded, created_at, operation_id
        ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?
          WHERE EXISTS (SELECT 1 FROM member_operations WHERE id = ?)`,
      )
      .bind(
        betId,
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
        operationId,
        operationId,
      ),
  ]);
  const completed = await findMemberOperation(db, operationId);
  if (!completed) throw new Error("残高が足りません");
  assertOperationMatches(completed, event.id, user.id, "bet", requestHash);
  await captureAnalysisSnapshot(db, event.id, "bet", now);
  return { selection_key: sel.selection_key };
}

/** やりなおし: 自分の未返還票を全取消し、残高に戻す */
export async function redoMyBets(
  db: D1Database,
  event: EventRow,
  user: UserRow,
  operationId = newId(),
): Promise<number> {
  if (event.status !== "voting") throw new Error("やりなおしは投票中だけです");
  if (!(await hasJoinedEvent(db, event.id, user.id))) {
    throw new Error("この開催にはまだ参加していません");
  }
  const requestHash = "redo:all-active-bets";
  const existing = await findMemberOperation(db, operationId);
  if (existing) {
    assertOperationMatches(existing, event.id, user.id, "redo", requestHash);
    return existing.result_amount;
  }
  const now = Date.now();
  await db.batch([
    db.prepare(
      `INSERT INTO member_operations (
        id, event_id, user_id, kind, request_hash, result_amount, bet_id, created_at
      ) SELECT ?, ?, ?, 'redo', ?, 0, NULL, ?
        WHERE NOT EXISTS (SELECT 1 FROM member_operations WHERE id = ?)
          AND EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'voting')
          AND EXISTS (SELECT 1 FROM bets WHERE event_id = ? AND user_id = ? AND refunded = 0)`,
    ).bind(operationId, event.id, user.id, requestHash, now, operationId, event.id, event.id, user.id),
    db.prepare(
      `INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at, operation_id)
       SELECT 'redo-' || lower(hex(randomblob(16))), b.event_id, b.user_id, b.id, b.amount, 'redo', ?, ?
       FROM bets b
       WHERE b.event_id = ? AND b.user_id = ? AND b.refunded = 0
         AND EXISTS (SELECT 1 FROM member_operations WHERE id = ? AND kind = 'redo' AND result_amount = 0)`,
    ).bind(now, operationId, event.id, user.id, operationId),
    db.prepare(
      `UPDATE users SET balance = balance + (
        SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE operation_id = ?
      ) WHERE id = ?
        AND EXISTS (SELECT 1 FROM member_operations WHERE id = ? AND result_amount = 0)
        AND EXISTS (SELECT 1 FROM payouts WHERE operation_id = ?)`,
    ).bind(operationId, user.id, operationId, operationId),
    db.prepare(
      "UPDATE bets SET refunded = 1 WHERE id IN (SELECT bet_id FROM payouts WHERE operation_id = ?)",
    ).bind(operationId),
    db.prepare(
      `UPDATE member_operations SET result_amount = (
        SELECT COALESCE(SUM(amount), 0) FROM payouts WHERE operation_id = ?
      ) WHERE id = ? AND result_amount = 0`,
    ).bind(operationId, operationId),
  ]);
  const completed = await findMemberOperation(db, operationId);
  if (!completed) throw new Error("取り消す馬券がありません");
  assertOperationMatches(completed, event.id, user.id, "redo", requestHash);
  await captureAnalysisSnapshot(db, event.id, "redo", now);
  return completed.result_amount;
}

type MemberOperation = {
  id: string;
  event_id: string;
  user_id: string;
  kind: "bet" | "redo";
  request_hash: string;
  result_amount: number;
};

async function findMemberOperation(db: D1Database, id: string): Promise<MemberOperation | null> {
  return await db.prepare("SELECT * FROM member_operations WHERE id = ?").bind(id).first<MemberOperation>();
}

function assertOperationMatches(
  operation: MemberOperation,
  eventId: string,
  userId: string,
  kind: MemberOperation["kind"],
  requestHash: string,
): void {
  if (operation.event_id !== eventId || operation.user_id !== userId || operation.kind !== kind || operation.request_hash !== requestHash) {
    throw new Error("この操作は再利用できません。画面を更新してからやり直してください");
  }
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
  await captureAnalysisSnapshot(db, event.id, "scratch");
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

export async function publishResults(
  db: D1Database,
  event: EventRow,
): Promise<"published" | "already_published"> {
  // 呼び出し元が保持する event は古い可能性があるため、確定判断は必ずDBの値で行う。
  const current = await db
    .prepare("SELECT * FROM events WHERE id = ?")
    .bind(event.id)
    .first<EventRow>();
  if (!current) throw new Error("開催が見つかりません");
  if (current.status === "published") return "already_published";
  if (current.status !== "closed") throw new Error("公開できるのは締切後だけです");
  if (current.payouts_applied) {
    await db
      .prepare(
        "UPDATE events SET status = 'published', published_at = ? WHERE id = ? AND status = 'closed' AND payouts_applied = 1",
      )
      .bind(Date.now(), current.id)
      .run();
    return "published";
  }
  const horses = await listHorses(db, current.id);
  const live = horses.filter((h) => h.scratched === 0);
  if (live.some((h) => h.finish_place == null)) {
    throw new Error("着順が入っていない頭があります");
  }
  const bets = await listActiveBets(db, current.id);
  const board = buildBoard(current, horses, bets);
  const now = Date.now();
  const payoutGuard = "EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'closed' AND payouts_applied = 0)";
  const stmts: D1PreparedStatement[] = [
    await prepareConditionalAdminUndo(db, "結果公開・払戻", current.id, "closed"),
  ];

  for (const pool of board.pools) {
    const kindBets = bets.filter((b) => b.kind === pool.kind);
    if (kindBets.length === 0) continue;
    if (pool.voidSpecial) {
      for (const b of kindBets) {
        const pay = specialPayoutAmount(b.amount, current.takeout_d);
        stmts.push(
          db.prepare(`UPDATE bets SET refunded = 1 WHERE id = ? AND ${payoutGuard}`).bind(b.id, current.id),
          db
            .prepare(`UPDATE users SET balance = balance + ? WHERE id = ? AND ${payoutGuard}`)
            .bind(pay, b.user_id, current.id),
          db
            .prepare(
              `INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at)
               SELECT ?, ?, ?, ?, ?, 'special', ? WHERE ${payoutGuard}`,
            )
            .bind(newId(), current.id, b.user_id, b.id, pay, now, current.id),
        );
      }
      continue;
    }
    const winKey = pool.winningKey;
    if (!winKey) throw new Error(`${pool.kind} の当選キーがありません`);
    const winnerReal = pool.combos.find((c) => c.selection_key === winKey)?.real ?? 0;
    const odds = parimutuelOdds(winnerReal, pool.realTotal, current.takeout_d);
    if (odds == null) throw new Error(`${pool.kind} の確定配当を計算できません`);
    for (const b of kindBets) {
      if (b.selection_key !== winKey) continue;
      const pay = payoutAmount(b.amount, odds);
      stmts.push(
        db
            .prepare(
              `INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at)
               SELECT ?, ?, ?, ?, ?, 'win', ? WHERE ${payoutGuard}`,
            )
            .bind(newId(), current.id, b.user_id, b.id, pay, now, current.id),
          db
            .prepare(`UPDATE users SET balance = balance + ? WHERE id = ? AND ${payoutGuard}`)
            .bind(pay, b.user_id, current.id),
      );
    }
  }

  stmts.push(
    db
      .prepare("UPDATE events SET status = 'published', published_at = ?, payouts_applied = 1 WHERE id = ? AND status = 'closed' AND payouts_applied = 0")
      .bind(now, current.id),
  );
  const results = await db.batch(stmts);
  const finalResult = results.at(-1);
  if ((finalResult?.meta.changes ?? 0) === 1) return "published";

  const settled = await db
    .prepare("SELECT status, payouts_applied FROM events WHERE id = ?")
    .bind(current.id)
    .first<Pick<EventRow, "status" | "payouts_applied">>();
  if (settled?.status === "published" && settled.payouts_applied) {
    return "already_published";
  }
  throw new Error("結果公開の確定に失敗しました。画面を更新して再試行してください");
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
