/**
 * 試運転: 直前の管理者操作を1手戻すためのスナップショット
 * メンバー投票は対象外。Undo の Undo は持たない。
 */

export type UndoMeta = {
  action_label: string;
  created_at: number;
};

type Snapshot = {
  events: Record<string, unknown>[];
  horses: Record<string, unknown>[];
  users: Record<string, unknown>[];
  grants: Record<string, unknown>[];
  bets: Record<string, unknown>[];
  payouts: Record<string, unknown>[];
  member_operations: Record<string, unknown>[];
};

async function allRows(
  db: D1Database,
  sql: string,
): Promise<Record<string, unknown>[]> {
  const { results } = await db.prepare(sql).all();
  return (results ?? []) as Record<string, unknown>[];
}

async function dumpSnapshot(db: D1Database): Promise<Snapshot> {
  const [events, horses, users, grants, bets, payouts, member_operations] = await Promise.all([
    allRows(db, "SELECT * FROM events"),
    allRows(db, "SELECT * FROM horses"),
    allRows(db, "SELECT * FROM users"),
    allRows(db, "SELECT * FROM grants"),
    allRows(db, "SELECT * FROM bets"),
    allRows(db, "SELECT * FROM payouts"),
    allRows(db, "SELECT * FROM member_operations"),
  ]);
  return { events, horses, users, grants, bets, payouts, member_operations };
}

function v(row: Record<string, unknown>, key: string): unknown {
  const x = row[key];
  return x === undefined ? null : x;
}

function insertEvents(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO events (
          id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
          w_time_floor, w_time_exp, voting_opened_at, voting_closes_at,
          closed_at, published_at, payouts_applied, created_at, enabled_kinds, is_current,
          score_setup
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        v(r, "id"),
        v(r, "title"),
        v(r, "status"),
        v(r, "grant_g"),
        v(r, "bet_unit"),
        v(r, "seed_pool_s"),
        v(r, "pull_e"),
        v(r, "takeout_d"),
        v(r, "w_time_floor"),
        v(r, "w_time_exp"),
        v(r, "voting_opened_at"),
        v(r, "voting_closes_at"),
        v(r, "closed_at"),
        v(r, "published_at"),
        v(r, "payouts_applied"),
        v(r, "created_at"),
        v(r, "enabled_kinds") ?? "win,umaren,umatan,sanrenpuku,sanrentan",
        v(r, "is_current") ?? 0,
        v(r, "score_setup"),
      ),
  );
}

function insertHorses(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO horses (
          id, event_id, name, uma_name, runner_name, shot_key, paddock_comment, trainer_icon_key, chara_id, dress_id, strength, score_input, seed_source, scratched, finish_place,
          sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        v(r, "id"),
        v(r, "event_id"),
        v(r, "name"),
        v(r, "uma_name") ?? "",
        v(r, "runner_name") ?? "",
        v(r, "shot_key"),
        v(r, "paddock_comment"),
        v(r, "trainer_icon_key"),
        v(r, "chara_id"),
        v(r, "dress_id"),
        v(r, "strength"),
        v(r, "score_input"),
        v(r, "seed_source"),
        v(r, "scratched"),
        v(r, "finish_place"),
        v(r, "sort_order"),
        v(r, "created_at"),
      ),
  );
}

function insertUsers(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO users (id, display_name, role, balance, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        v(r, "id"),
        v(r, "display_name"),
        v(r, "role"),
        v(r, "balance"),
        v(r, "created_at"),
      ),
  );
}

function insertGrants(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO grants (event_id, user_id, amount, created_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(v(r, "event_id"), v(r, "user_id"), v(r, "amount"), v(r, "created_at")),
  );
}

function insertBets(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO bets (
          id, event_id, user_id, horse_id, kind, selection_key,
          horse_1, horse_2, horse_3, amount, refunded, created_at, operation_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        v(r, "id"),
        v(r, "event_id"),
        v(r, "user_id"),
        v(r, "horse_id") ?? v(r, "horse_1"),
        v(r, "kind") ?? "win",
        v(r, "selection_key") ?? v(r, "horse_id") ?? v(r, "horse_1"),
        v(r, "horse_1") ?? v(r, "horse_id"),
        v(r, "horse_2"),
        v(r, "horse_3"),
        v(r, "amount"),
        v(r, "refunded"),
        v(r, "created_at"),
        v(r, "operation_id"),
      ),
  );
}

function insertPayouts(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db
      .prepare(
        `INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at, operation_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        v(r, "id"),
        v(r, "event_id"),
        v(r, "user_id"),
        v(r, "bet_id"),
        v(r, "amount"),
        v(r, "kind"),
        v(r, "created_at"),
        v(r, "operation_id"),
      ),
  );
}

function insertMemberOperations(db: D1Database, rows: Record<string, unknown>[]) {
  return rows.map((r) =>
    db.prepare(
      `INSERT INTO member_operations (
        id, event_id, user_id, kind, request_hash, result_amount, bet_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      v(r, "id"), v(r, "event_id"), v(r, "user_id"), v(r, "kind"),
      v(r, "request_hash"), v(r, "result_amount"), v(r, "bet_id"), v(r, "created_at"),
    ),
  );
}

/** 検証を通った管理操作の直前に呼ぶ。失敗した操作では呼ばないこと */
export async function captureAdminUndo(
  db: D1Database,
  actionLabel: string,
): Promise<void> {
  const payload = JSON.stringify(await dumpSnapshot(db));
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_undo (id, action_label, payload, created_at)
       VALUES (1, ?, ?, ?)`,
    )
    .bind(actionLabel, payload, Date.now())
    .run();
}

/**
 * 指定状態の開催に限って Undo を記録する文を用意する。
 * 公開処理では払戻と同じ batch に入れ、負けた同時実行が Undo を上書きしないようにする。
 */
export async function prepareConditionalAdminUndo(
  db: D1Database,
  actionLabel: string,
  eventId: string,
  status: string,
): Promise<D1PreparedStatement> {
  const payload = JSON.stringify(await dumpSnapshot(db));
  return db
    .prepare(
      `INSERT INTO admin_undo (id, action_label, payload, created_at)
       SELECT 1, ?, ?, ?
       WHERE EXISTS (SELECT 1 FROM events WHERE id = ? AND status = ?)
       ON CONFLICT(id) DO UPDATE SET
         action_label = excluded.action_label,
         payload = excluded.payload,
         created_at = excluded.created_at`,
    )
    .bind(actionLabel, payload, Date.now(), eventId, status);
}

export async function getAdminUndoMeta(
  db: D1Database,
): Promise<UndoMeta | null> {
  const row = await db
    .prepare("SELECT action_label, created_at FROM admin_undo WHERE id = 1")
    .first<UndoMeta>();
  return row ?? null;
}

export async function applyAdminUndo(db: D1Database): Promise<string> {
  const row = await db
    .prepare("SELECT action_label, payload FROM admin_undo WHERE id = 1")
    .first<{ action_label: string; payload: string }>();
  if (!row) throw new Error("戻せる操作がありません");
  let snap: Snapshot;
  try {
    snap = JSON.parse(row.payload) as Snapshot;
  } catch {
    throw new Error("巻き戻しデータが壊れています");
  }

  const stmts = [
    db.prepare("DELETE FROM member_operations"),
    db.prepare("DELETE FROM payouts"),
    db.prepare("DELETE FROM bets"),
    db.prepare("DELETE FROM grants"),
    db.prepare("DELETE FROM horses"),
    db.prepare("DELETE FROM events"),
    db.prepare("DELETE FROM users"),
    ...insertEvents(db, snap.events),
    ...insertUsers(db, snap.users),
    ...insertHorses(db, snap.horses),
    ...insertGrants(db, snap.grants),
    ...insertMemberOperations(db, snap.member_operations ?? []),
    ...insertBets(db, snap.bets),
    ...insertPayouts(db, snap.payouts),
  ];
  for (let i = 0; i < stmts.length; i += 40) {
    await db.batch(stmts.slice(i, i + 40));
  }
  await db.prepare("DELETE FROM admin_undo").run();
  const cur = await db
    .prepare("SELECT id FROM events WHERE is_current = 1 LIMIT 1")
    .first();
  if (!cur) {
    await db
      .prepare(
        `UPDATE events SET is_current = 1 WHERE id = (
          SELECT id FROM events ORDER BY created_at DESC LIMIT 1
        )`,
      )
      .run();
  }
  return row.action_label;
}
