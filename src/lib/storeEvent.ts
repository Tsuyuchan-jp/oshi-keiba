/**
 * store 開催（確保・締切・設定・次開催）
 */

import {
  DEFAULT_ENABLED_KINDS,
  parseEnabledKinds,
  serializeEnabledKinds,
} from "./bets";
import { newId } from "./auth";
import { DEFAULTS } from "./odds";
import { captureAnalysisSnapshotSafely } from "./analysisLog";
import {
  parseScoreSetup,
  serializeScoreSetup,
  type EventScoreSetup,
} from "./scoreSetup";
import { captureAdminUndo } from "./undo";
import type { ScoreRecomputeChange } from "./scoreRecompute";
import type { EventRow } from "./storeTypes";

export type { EventScoreSetup };

function normalizeEvent(row: EventRow): EventRow {
  // 壊れた JSON は捨てて null（直置きのみ）
  const setup = parseScoreSetup(row.score_setup ?? null);
  return {
    ...row,
    enabled_kinds: serializeEnabledKinds(parseEnabledKinds(row.enabled_kinds)),
    is_current: Number(row.is_current) ? 1 : 0,
    score_setup: serializeScoreSetup(setup),
  };
}

/** 管理画面用。正規化済みイベントから型付き setup を取る */
export function eventScoreSetup(event: EventRow): EventScoreSetup | null {
  return parseScoreSetup(event.score_setup);
}

const INSERT_EVENT_SQL = `INSERT INTO events (
        id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
        w_time_floor, w_time_exp, enabled_kinds, created_at, is_current
      ) VALUES (?, ?, 'setup', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function insertBlankEvent(
  db: D1Database,
  current: boolean,
  title = "",
): Promise<string> {
  const id = newId();
  const now = Date.now();
  await db
    .prepare(INSERT_EVENT_SQL)
    .bind(
      id,
      title,
      DEFAULTS.grantG,
      DEFAULTS.betUnit,
      DEFAULTS.seedPoolS,
      DEFAULTS.pullE,
      DEFAULTS.takeoutD,
      DEFAULTS.wTimeFloor,
      DEFAULTS.wTimeExp,
      DEFAULT_ENABLED_KINDS,
      now,
      current ? 1 : 0,
    )
    .run();
  return id;
}

export async function getEventById(
  db: D1Database,
  id: string,
): Promise<EventRow | null> {
  const row = await db
    .prepare("SELECT * FROM events WHERE id = ?")
    .bind(id)
    .first<EventRow>();
  return row ? normalizeEvent(row) : null;
}

async function pickCurrentEvent(db: D1Database): Promise<EventRow | null> {
  const current = await db
    .prepare("SELECT * FROM events WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1")
    .first<EventRow>();
  if (current) return normalizeEvent(current);
  const latest = await db
    .prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
    .first<EventRow>();
  if (!latest) return null;
  await db
    .prepare("UPDATE events SET is_current = CASE WHEN id = ? THEN 1 ELSE 0 END")
    .bind(latest.id)
    .run();
  return normalizeEvent({ ...latest, is_current: 1 });
}

export async function ensureEvent(db: D1Database): Promise<EventRow> {
  const existing = await pickCurrentEvent(db);
  if (existing) return existing;
  const id = await insertBlankEvent(db, true, "推し活イベントレース");
  return (await getEventById(db, id))!;
}

export async function maybeAutoClose(
  db: D1Database,
  event: EventRow,
  now = Date.now(),
): Promise<EventRow> {
  if (
    event.status === "voting" &&
    event.voting_closes_at != null &&
    now >= event.voting_closes_at
  ) {
    await db
      .prepare(
        "UPDATE events SET status = 'closed', closed_at = ? WHERE id = ? AND status = 'voting'",
      )
      .bind(now, event.id)
      .run();
    const closed = (await getEventById(db, event.id))!;
    await captureAnalysisSnapshotSafely(db, closed.id, "close", now);
    return closed;
  }
  return event;
}

export async function updateParams(
  db: D1Database,
  event: EventRow,
  patch: {
    grant_g?: number;
    bet_unit?: number;
    seed_pool_s?: number;
    pull_e?: number;
    takeout_d?: number;
    w_time_floor?: number;
    w_time_exp?: number;
    title?: string;
    voting_closes_at?: number | null;
    enabled_kinds?: string;
    /** 渡したら上書き。undefined なら触らない。null でクリア */
    score_setup?: EventScoreSetup | null;
  },
  changes: readonly ScoreRecomputeChange[] = [],
): Promise<void> {
  await captureAdminUndo(db, "レースイベント設定を保存");
  const kinds =
    event.status === "setup" && patch.enabled_kinds != null
      ? serializeEnabledKinds(parseEnabledKinds(patch.enabled_kinds))
      : event.enabled_kinds;
  const scoreSetupJson =
    patch.score_setup === undefined
      ? event.score_setup
      : serializeScoreSetup(patch.score_setup);
  const update = db
    .prepare(
      `UPDATE events SET
        title = ?,
        grant_g = ?,
        bet_unit = ?,
        seed_pool_s = ?,
        pull_e = ?,
        takeout_d = ?,
        w_time_floor = ?,
        w_time_exp = ?,
        voting_closes_at = ?,
        enabled_kinds = ?,
        score_setup = ?
      WHERE id = ?`,
    )
    .bind(
      patch.title ?? event.title,
      patch.grant_g ?? event.grant_g,
      patch.bet_unit ?? event.bet_unit,
      patch.seed_pool_s ?? event.seed_pool_s,
      patch.pull_e ?? event.pull_e,
      patch.takeout_d ?? event.takeout_d,
      patch.w_time_floor ?? event.w_time_floor,
      patch.w_time_exp ?? event.w_time_exp,
      patch.voting_closes_at === undefined
        ? event.voting_closes_at
        : patch.voting_closes_at,
      kinds,
      scoreSetupJson,
      event.id,
    )
    ;
  const rescore = changes.map((change) =>
    db.prepare("UPDATE horses SET strength = ? WHERE id = ? AND event_id = ?")
      .bind(change.after, change.horseId, event.id),
  );
  await db.batch([update, ...rescore]);
}

/** 公開済みのあと、空の setup をカレントにする。口座は残す */
export async function openNextEvent(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "published") {
    throw new Error("次の開催を開けるのは結果公開のあとだけです");
  }
  await captureAdminUndo(db, "次の開催を開く");
  await db.prepare("UPDATE events SET is_current = 0").run();
  await insertBlankEvent(db, true, "");
}

/** setup のカレントを捨て、直前の開催をカレントに戻す */
export async function discardCurrentSetup(
  db: D1Database,
  event: EventRow,
): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("破棄できるのは出走登録中だけです");
  }
  await captureAdminUndo(db, "この開催を破棄");
  await db.batch([
    db.prepare("DELETE FROM member_operations WHERE event_id = ?").bind(event.id),
    db.prepare("DELETE FROM payouts WHERE event_id = ?").bind(event.id),
    db.prepare("DELETE FROM bets WHERE event_id = ?").bind(event.id),
    db.prepare("DELETE FROM grants WHERE event_id = ?").bind(event.id),
    db.prepare("DELETE FROM horses WHERE event_id = ?").bind(event.id),
    db.prepare("DELETE FROM events WHERE id = ?").bind(event.id),
  ]);
  const prev = await db
    .prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
    .first<EventRow>();
  if (prev) {
    await db
      .prepare("UPDATE events SET is_current = CASE WHEN id = ? THEN 1 ELSE 0 END")
      .bind(prev.id)
      .run();
  } else {
    await insertBlankEvent(db, true, "推し活イベントレース");
  }
}

/** ローカル実機用。開催・票を消し、残高は 0。名前は残す。G は配らない */
export async function resetDemo(db: D1Database): Promise<void> {
  await captureAdminUndo(db, "デモ初期化");
  await db.batch([
    db.prepare("DELETE FROM member_operations"),
    db.prepare("DELETE FROM payouts"),
    db.prepare("DELETE FROM bets"),
    db.prepare("DELETE FROM grants"),
    db.prepare("DELETE FROM horses"),
    db.prepare("DELETE FROM events"),
    db.prepare("UPDATE users SET balance = 0"),
  ]);
  await insertBlankEvent(db, true, "推し活イベントレース");
}
