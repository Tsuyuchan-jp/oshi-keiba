import {
  betIncludesHorse,
  DEFAULT_ENABLED_KINDS,
  isBetKind,
  kindIsEnabled,
  normalizeSelection,
  parseEnabledKinds,
  serializeEnabledKinds,
  winningKey,
  type BetKind,
} from "./bets";
import {
  allocateSeed,
  DEFAULTS,
  displayPool,
  addImputed,
  IMPUTED_LAMBDA,
  parimutuelOdds,
  payoutAmount,
  referenceTv,
  specialPayoutAmount,
  wCombined,
  wTime,
  wVolume,
} from "./odds";
import { newId } from "./auth";
import { captureAdminUndo } from "./undo";
import { clawbackBalance } from "./lifecycle";
import { composeHorseName, horseSheetParts, parseHorseName } from "./horseName";

export { clawbackBalance, joinButtonLabel } from "./lifecycle";

export type EventStatus = "setup" | "voting" | "closed" | "published";

export type EventRow = {
  id: string;
  title: string;
  status: EventStatus;
  grant_g: number;
  bet_unit: number;
  seed_pool_s: number;
  pull_e: number;
  takeout_d: number;
  w_time_floor: number;
  w_time_exp: number;
  voting_opened_at: number | null;
  voting_closes_at: number | null;
  closed_at: number | null;
  published_at: number | null;
  payouts_applied: number;
  created_at: number;
  /** カンマ区切り。単勝は常に含む */
  enabled_kinds: string;
  /** 1 ならメンバー画面の開催 */
  is_current: number;
};

function normalizeEvent(row: EventRow): EventRow {
  return {
    ...row,
    enabled_kinds: serializeEnabledKinds(parseEnabledKinds(row.enabled_kinds)),
    is_current: Number(row.is_current) ? 1 : 0,
  };
}

export type HorseRow = {
  id: string;
  event_id: string;
  name: string;
  uma_name: string;
  runner_name: string;
  shot_key: string | null;
  strength: number;
  seed_source: string;
  scratched: number;
  finish_place: number | null;
  sort_order: number;
};

export type UserRow = {
  id: string;
  display_name: string;
  role: string;
  balance: number;
};

export type BetRow = {
  id: string;
  event_id: string;
  user_id: string;
  /** 旧単勝列。移行後も残るが読みは horse_1 優先 */
  horse_id: string;
  kind: BetKind;
  selection_key: string;
  horse_1: string;
  horse_2: string | null;
  horse_3: string | null;
  amount: number;
  refunded: number;
  created_at: number;
};

export type HorseBoard = {
  horse: HorseRow;
  /** 通し番号（1..n）。名簿の並び */
  number: number;
  real: number;
  imputed: number;
  seed: number;
  display: number;
  referenceOdds: number | null;
  confirmedOdds: number | null;
};

export type PoolCombo = {
  selection_key: string;
  horse_1: string;
  horse_2: string | null;
  horse_3: string | null;
  real: number;
  odds: number | null;
};

export type KindPool = {
  kind: BetKind;
  realTotal: number;
  combos: PoolCombo[];
  /** 着順があるとき。当たり実票ゼロなら特払い予定 */
  winningKey: string | null;
  voidSpecial: boolean | null;
};

export type Board = {
  event: EventRow;
  wTime: number;
  wVolume: number;
  w: number;
  /** 単勝実票合計 */
  realTotal: number;
  /** 連勝実票合計（返還済み除く） */
  exoticTotal: number;
  /** 単勝参考の TV（単勝 + λ×連勝） */
  tv: number;
  seedTotal: number;
  displayTotal: number;
  horses: HorseBoard[];
  pools: KindPool[];
};

/** 試運転: 頭数 2〜18 */
const MIN_LIVE_HORSES = 2;
const MAX_LIVE_HORSES = 18;

const INSERT_EVENT_SQL = `INSERT INTO events (
        id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
        w_time_floor, w_time_exp, enabled_kinds, created_at, is_current
      ) VALUES (?, ?, 'setup', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

async function insertBlankEvent(
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

const DEMO_HORSES: { umaName: string; runnerName: string; strength: number }[] = [
  { umaName: "仮・スペシャルウィーク", runnerName: "デモ", strength: 28 },
  { umaName: "仮・サイレンススズカ", runnerName: "デモ", strength: 22 },
  { umaName: "仮・トウカイテイオー", runnerName: "デモ", strength: 18 },
  { umaName: "仮・ゴールドシップ", runnerName: "デモ", strength: 14 },
  { umaName: "仮・メジロマックイーン", runnerName: "デモ", strength: 10 },
  { umaName: "仮・オグリキャップ", runnerName: "デモ", strength: 8 },
  { umaName: "仮・ダイワスカーレット", runnerName: "デモ", strength: 6 },
  { umaName: "仮・ウオッカ", runnerName: "デモ", strength: 5 },
  { umaName: "仮・エアグルーヴ", runnerName: "デモ", strength: 4 },
  { umaName: "仮・テイエムオペラオー", runnerName: "デモ", strength: 3 },
];

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
    return (await getEventById(db, event.id))!;
  }
  return event;
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

function hydrateHorseRow(row: HorseRow): HorseRow {
  const parts = horseSheetParts(row);
  return {
    ...row,
    uma_name: parts.umaName,
    runner_name: parts.runnerName,
    shot_key: row.shot_key ?? null,
    name: composeHorseName(parts.umaName, parts.runnerName) || row.name,
  };
}

function normalizeBetRow(raw: Record<string, unknown>): BetRow {
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

function buildKindPool(
  kind: BetKind,
  bets: BetRow[],
  horses: HorseRow[],
  takeoutD: number,
  confirmed: boolean,
): KindPool {
  const kindBets = bets.filter((b) => !b.refunded && b.kind === kind);
  const byKey = new Map<
    string,
    { horse_1: string; horse_2: string | null; horse_3: string | null; real: number }
  >();
  for (const b of kindBets) {
    const cur = byKey.get(b.selection_key);
    if (cur) {
      cur.real += b.amount;
    } else {
      byKey.set(b.selection_key, {
        horse_1: b.horse_1,
        horse_2: b.horse_2,
        horse_3: b.horse_3,
        real: b.amount,
      });
    }
  }
  const realTotal = [...byKey.values()].reduce((a, x) => a + x.real, 0);
  const combos: PoolCombo[] = [...byKey.entries()]
    .map(([selection_key, v]) => ({
      selection_key,
      horse_1: v.horse_1,
      horse_2: v.horse_2,
      horse_3: v.horse_3,
      real: v.real,
      odds:
        confirmed || kind !== "win"
          ? parimutuelOdds(v.real, realTotal, takeoutD)
          : null,
    }))
    .sort((a, b) => b.real - a.real);

  const winKey = winningKey(kind, horses);
  let voidSpecial: boolean | null = null;
  if (winKey != null) {
    const winnerReal = byKey.get(winKey)?.real ?? 0;
    voidSpecial = winnerReal <= 0;
  }

  return { kind, realTotal, combos, winningKey: winKey, voidSpecial };
}

export function buildBoard(
  event: EventRow,
  horses: HorseRow[],
  bets: BetRow[],
  now = Date.now(),
): Board {
  const live = horses.filter((h) => h.scratched === 0);
  const winBets = bets.filter((b) => !b.refunded && b.kind === "win");
  const realByHorse = new Map<string, number>();
  for (const b of winBets) {
    realByHorse.set(b.horse_1, (realByHorse.get(b.horse_1) ?? 0) + b.amount);
  }
  const realLive = live.map((h) => realByHorse.get(h.id) ?? 0);
  const realTotal = realLive.reduce((a, b) => a + b, 0);
  const imputedMap = new Map<string, number>();
  let exoticTotal = 0;
  for (const b of bets) {
    if (b.refunded || b.kind === "win") continue;
    exoticTotal += b.amount;
    addImputed(
      b.kind,
      b.amount,
      b.horse_1,
      b.horse_2,
      b.horse_3,
      IMPUTED_LAMBDA,
      imputedMap,
    );
  }
  const imputedLive = live.map((h) => imputedMap.get(h.id) ?? 0);
  const tv = referenceTv(realTotal, exoticTotal, IMPUTED_LAMBDA);
  const seeds = allocateSeed(
    live.map((h) => h.strength),
    event.seed_pool_s,
  );
  const wT = wTime(
    now,
    event.voting_opened_at,
    event.voting_closes_at,
    event.w_time_floor,
    event.w_time_exp,
  );
  const wV = wVolume(tv, event.pull_e);
  const w = wCombined(wT, wV);
  const displays = seeds.map((s, i) =>
    displayPool(s, w, realLive[i], imputedLive[i]),
  );
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const seedTotal = seeds.reduce((a, b) => a + b, 0);

  const seedById = new Map<string, number>();
  const displayById = new Map<string, number>();
  live.forEach((h, i) => {
    seedById.set(h.id, seeds[i]);
    displayById.set(h.id, displays[i]);
  });

  const confirmed =
    event.status === "closed" || event.status === "published";

  let number = 0;
  const rows: HorseBoard[] = horses.map((h) => {
    if (!h.scratched) number += 1;
    const num = h.scratched ? 0 : number;
    const real = realByHorse.get(h.id) ?? 0;
    if (h.scratched) {
      return {
        horse: h,
        number: 0,
        real,
        imputed: 0,
        seed: 0,
        display: 0,
        referenceOdds: null,
        confirmedOdds: null,
      };
    }
    const seed = seedById.get(h.id) ?? 0;
    const display = displayById.get(h.id) ?? 0;
    return {
      horse: h,
      number: num,
      real,
      imputed: imputedMap.get(h.id) ?? 0,
      seed,
      display,
      referenceOdds: parimutuelOdds(display, displayTotal, event.takeout_d),
      confirmedOdds: parimutuelOdds(real, realTotal, event.takeout_d),
    };
  });

  const pools = (
    ["win", "umaren", "umatan", "sanrenpuku", "sanrentan"] as BetKind[]
  ).map((kind) => buildKindPool(kind, bets, horses, event.takeout_d, confirmed));

  // 単勝の combos に参考オッズを載せる（投票中）
  const winPool = pools.find((p) => p.kind === "win")!;
  if (!confirmed) {
    winPool.combos = rows
      .filter((h) => !h.horse.scratched)
      .map((h) => ({
        selection_key: h.horse.id,
        horse_1: h.horse.id,
        horse_2: null,
        horse_3: null,
        real: h.real,
        odds: h.referenceOdds,
      }));
  } else {
    winPool.combos = rows
      .filter((h) => !h.horse.scratched)
      .map((h) => ({
        selection_key: h.horse.id,
        horse_1: h.horse.id,
        horse_2: null,
        horse_3: null,
        real: h.real,
        odds: h.confirmedOdds,
      }));
  }

  return {
    event,
    wTime: wT,
    wVolume: wV,
    w,
    realTotal,
    exoticTotal,
    tv,
    seedTotal,
    displayTotal,
    horses: rows,
    pools,
  };
}

export async function loadBoard(db: D1Database, now = Date.now()): Promise<Board> {
  let event = await ensureEvent(db);
  event = await maybeAutoClose(db, event, now);
  const [horses, bets] = await Promise.all([
    listHorses(db, event.id),
    listActiveBets(db, event.id),
  ]);
  return buildBoard(event, horses, bets, now);
}

export function numberByHorseId(board: Board): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of board.horses) {
    if (!h.horse.scratched && h.number > 0) m.set(h.horse.id, h.number);
  }
  return m;
}

export async function upsertUser(
  db: D1Database,
  displayName: string,
  role: "member" | "admin",
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  if (name.length > 40) throw new Error("表示名が長すぎます");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ?")
    .bind(name)
    .first<UserRow>();
  if (existing) return existing;
  const user: UserRow = {
    id: newId(),
    display_name: name,
    role,
    balance: 0,
  };
  await db
    .prepare(
      "INSERT INTO users (id, display_name, role, balance, created_at) VALUES (?, ?, ?, 0, ?)",
    )
    .bind(user.id, user.display_name, role, Date.now())
    .run();
  return user;
}

/** 初めて入室: 同名ありは拒否。口座作成。G は開催参加時 */
export async function registerMember(
  db: D1Database,
  displayName: string,
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  if (name.length > 40) throw new Error("表示名が長すぎます");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ?")
    .bind(name)
    .first<UserRow>();
  if (existing) throw new Error("この名前はすでに使われています");
  return upsertUser(db, name, "member");
}

/** 登録済み再入室: 名前なしは拒否。G は開催参加時 */
export async function loginMember(
  db: D1Database,
  displayName: string,
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ? AND role = 'member'")
    .bind(name)
    .first<UserRow>();
  if (!existing) throw new Error("この名前は登録されていません");
  return existing;
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

/** 投票中の初回参加。G を1回だけ足す */
export async function joinEvent(
  db: D1Database,
  event: EventRow,
  user: UserRow,
): Promise<UserRow> {
  if (user.role !== "member") throw new Error("メンバーだけ参加できます");
  if (event.status !== "voting") {
    throw new Error("参加できるのは投票中だけです");
  }
  return grantIfNeeded(db, event, user);
}

export async function getUser(
  db: D1Database,
  userId: string,
): Promise<UserRow | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
}

export async function grantIfNeeded(
  db: D1Database,
  event: EventRow,
  user: UserRow,
): Promise<UserRow> {
  const already = await db
    .prepare("SELECT amount FROM grants WHERE event_id = ? AND user_id = ?")
    .bind(event.id, user.id)
    .first<{ amount: number }>();
  if (already) return user;
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        "INSERT INTO grants (event_id, user_id, amount, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(event.id, user.id, event.grant_g, now),
    db
      .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
      .bind(event.grant_g, user.id),
  ]);
  return (await getUser(db, user.id))!;
}

export async function addHorse(
  db: D1Database,
  event: EventRow,
  umaName: string,
  runnerName: string,
  strength: number,
  recordUndo = true,
): Promise<string> {
  if (event.status !== "setup") {
    throw new Error("名簿は投票開始後は閉じます（飛び入り禁止）");
  }
  const uma = umaName.trim();
  const runner = runnerName.trim();
  if (!uma) throw new Error("ウマ娘名を入れてください");
  if (!runner) throw new Error("出走者を入れてください");
  if (!(strength >= 0)) throw new Error("相対評価点が不正です");
  const combined = composeHorseName(uma, runner);
  const horses = await listHorses(db, event.id);
  const live = horses.filter((h) => h.scratched === 0).length;
  if (live >= MAX_LIVE_HORSES) {
    throw new Error(`頭数は ${MAX_LIVE_HORSES} まで`);
  }
  if (recordUndo) await captureAdminUndo(db, `出走を追加（${combined}）`);
  const id = newId();
  await db
    .prepare(
      `INSERT INTO horses (
        id, event_id, name, uma_name, runner_name, strength, seed_source, scratched, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'manual', 0, ?, ?)`,
    )
    .bind(id, event.id, combined, uma, runner, strength, horses.length + 1, Date.now())
    .run();
  return id;
}

export async function updateHorse(
  db: D1Database,
  event: EventRow,
  horseId: string,
  umaName: string,
  runnerName: string,
  strength: number,
  recordUndo = true,
): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("セットアップ中だけ修正できます");
  }
  const uma = umaName.trim();
  const runner = runnerName.trim();
  if (!uma) throw new Error("ウマ娘名を入れてください");
  if (!runner) throw new Error("出走者を入れてください");
  if (!(strength >= 0)) throw new Error("相対評価点が不正です");
  const combined = composeHorseName(uma, runner);
  const horse = await db
    .prepare("SELECT id FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first();
  if (!horse) throw new Error("出走が見つかりません");
  if (recordUndo) await captureAdminUndo(db, `出走を修正（${combined}）`);
  await db
    .prepare(
      "UPDATE horses SET name = ?, uma_name = ?, runner_name = ?, strength = ? WHERE id = ? AND event_id = ?",
    )
    .bind(combined, uma, runner, strength, horseId, event.id)
    .run();
}

export const MAX_SHOT_BYTES = 2_000_000;

export async function setHorseShotKey(
  db: D1Database,
  event: EventRow,
  horseId: string,
  shotKey: string,
): Promise<void> {
  const horse = await db
    .prepare("SELECT id FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first();
  if (!horse) throw new Error("出走が見つかりません");
  await db
    .prepare("UPDATE horses SET shot_key = ? WHERE id = ? AND event_id = ?")
    .bind(shotKey, horseId, event.id)
    .run();
}

/** 一括: ウマ娘、出走者、点数。旧「名前、点数」はウマ娘のみ（出走者は要手直し） */
export async function bulkUpsertHorses(
  db: D1Database,
  event: EventRow,
  text: string,
): Promise<number> {
  if (event.status !== "setup") {
    throw new Error("セットアップ中だけ一括登録できます");
  }
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("貼り付け内容が空です");
  const parsed: { umaName: string; runnerName: string; strength: number }[] = [];
  for (const line of lines) {
    const three = line.match(/^(.+?)[、,]\s*(.+?)[、,]\s*(-?\d+(?:\.\d+)?)\s*$/);
    const two = line.match(/^(.+?)[、,]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (three) {
      parsed.push({
        umaName: three[1].trim(),
        runnerName: three[2].trim(),
        strength: Number(three[3]),
      });
    } else if (two) {
      const split = parseHorseName(two[1].trim());
      parsed.push({
        umaName: split.umaName,
        runnerName: split.runnerName,
        strength: Number(two[2]),
      });
    } else {
      throw new Error(`形式が違います: ${line}`);
    }
    const last = parsed[parsed.length - 1];
    if (!last.umaName) throw new Error(`ウマ娘名が空です: ${line}`);
    if (!(last.strength >= 0)) throw new Error(`点数が不正です: ${line}`);
  }
  await captureAdminUndo(db, `出走を一括反映（${parsed.length} 行）`);
  const existing = await listHorses(db, event.id);
  const byUma = new Map(existing.map((h) => [h.uma_name || parseHorseName(h.name).umaName, h]));
  let live = existing.filter((h) => !h.scratched).length;
  let n = 0;
  for (const row of parsed) {
    const hit = byUma.get(row.umaName);
    if (hit) {
      await updateHorse(db, event, hit.id, row.umaName, row.runnerName, row.strength, false);
    } else {
      if (live >= MAX_LIVE_HORSES) {
        throw new Error(`頭数は ${MAX_LIVE_HORSES} まで（途中で上限）`);
      }
      if (!row.runnerName) {
        throw new Error(`出走者が空です: ${row.umaName}（3列「ウマ娘、出走者、点数」で入れてください）`);
      }
      const id = await addHorse(db, event, row.umaName, row.runnerName, row.strength, false);
      byUma.set(row.umaName, {
        id,
        event_id: event.id,
        name: composeHorseName(row.umaName, row.runnerName),
        uma_name: row.umaName,
        runner_name: row.runnerName,
        shot_key: null,
        strength: row.strength,
        seed_source: "manual",
        scratched: 0,
        finish_place: null,
        sort_order: 0,
      });
      live += 1;
    }
    n += 1;
  }
  return n;
}

export async function seedDemoHorses(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("セットアップ中だけデモ出走を入れられます");
  }
  const existing = await listHorses(db, event.id);
  if (existing.length > 0) throw new Error("すでに出走が登録されています");
  const now = Date.now();
  const stmts = DEMO_HORSES.map((h, i) =>
    db
      .prepare(
        `INSERT INTO horses (
          id, event_id, name, uma_name, runner_name, strength, seed_source, scratched, sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'manual', 0, ?, ?)`,
      )
      .bind(
        newId(),
        event.id,
        composeHorseName(h.umaName, h.runnerName),
        h.umaName,
        h.runnerName,
        h.strength,
        i + 1,
        now,
      ),
  );
  await db.batch(stmts);
}

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
  },
): Promise<void> {
  await captureAdminUndo(db, "レースイベント設定を保存");
  const kinds =
    event.status === "setup" && patch.enabled_kinds != null
      ? serializeEnabledKinds(parseEnabledKinds(patch.enabled_kinds))
      : event.enabled_kinds;
  await db
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
        enabled_kinds = ?
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
      event.id,
    )
    .run();
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

/** 試運転: メンバー口座ごと削除。票はプールから消える */
export async function deleteMember(
  db: D1Database,
  userId: string,
): Promise<string> {
  const user = await getUser(db, userId);
  if (!user || user.role !== "member") {
    throw new Error("削除できるメンバーが見つかりません");
  }
  await captureAdminUndo(db, `メンバー削除（${user.display_name}）`);
  await db.batch([
    db.prepare("DELETE FROM payouts WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM bets WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM grants WHERE user_id = ?").bind(userId),
    db
      .prepare("DELETE FROM users WHERE id = ? AND role = 'member'")
      .bind(userId),
  ]);
  return user.display_name;
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

/** setup 中の出走だけ消す */
export async function clearHorses(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("出走を空にできるのは出走登録中だけです");
  }
  await captureAdminUndo(db, "出走を空にする");
  await db.prepare("DELETE FROM horses WHERE event_id = ?").bind(event.id).run();
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

/** ローカル実機用。開催・票を消し、残高は 0。名前は残す。G は配らない */
export async function resetDemo(db: D1Database): Promise<void> {
  await captureAdminUndo(db, "デモ初期化");
  await db.batch([
    db.prepare("DELETE FROM payouts"),
    db.prepare("DELETE FROM bets"),
    db.prepare("DELETE FROM grants"),
    db.prepare("DELETE FROM horses"),
    db.prepare("DELETE FROM events"),
    db.prepare("UPDATE users SET balance = 0"),
  ]);
  await insertBlankEvent(db, true, "推し活イベントレース");
}
