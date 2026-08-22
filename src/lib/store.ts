import {
  allocateSeed,
  DEFAULTS,
  displayPool,
  parimutuelOdds,
  payoutAmount,
  wCombined,
  wTime,
  wVolume,
} from "./odds";
import { newId } from "./auth";

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
};

export type HorseRow = {
  id: string;
  event_id: string;
  name: string;
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
  horse_id: string;
  amount: number;
  refunded: number;
  created_at: number;
};

export type HorseBoard = {
  horse: HorseRow;
  real: number;
  seed: number;
  display: number;
  referenceOdds: number | null;
  confirmedOdds: number | null;
};

export type Board = {
  event: EventRow;
  wTime: number;
  wVolume: number;
  w: number;
  realTotal: number;
  seedTotal: number;
  displayTotal: number;
  horses: HorseBoard[];
  winVoid: boolean;
  winnerId: string | null;
};

const DEMO_EVENT_ID = "demo-week";
/** 取消前の出走登録。下限は投票開始時のみ、上限は登録時と投票開始の両方で見る */
const MIN_LIVE_HORSES = 5;
const MAX_LIVE_HORSES = 18;

const DEMO_HORSES: { name: string; strength: number }[] = [
  { name: "仮・スペシャルウィーク", strength: 28 },
  { name: "仮・サイレンススズカ", strength: 22 },
  { name: "仮・トウカイテイオー", strength: 18 },
  { name: "仮・ゴールドシップ", strength: 14 },
  { name: "仮・メジロマックイーン", strength: 10 },
  { name: "仮・オグリキャップ", strength: 8 },
  { name: "仮・ダイワスカーレット", strength: 6 },
];

export async function ensureEvent(db: D1Database): Promise<EventRow> {
  const existing = await db
    .prepare("SELECT * FROM events WHERE id = ?")
    .bind(DEMO_EVENT_ID)
    .first<EventRow>();
  if (existing) return existing;
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO events (
        id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
        w_time_floor, w_time_exp, created_at
      ) VALUES (?, ?, 'setup', ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      DEMO_EVENT_ID,
      "推し活イベントレース（仮）",
      DEFAULTS.grantG,
      DEFAULTS.betUnit,
      DEFAULTS.seedPoolS,
      DEFAULTS.pullE,
      DEFAULTS.takeoutD,
      DEFAULTS.wTimeFloor,
      DEFAULTS.wTimeExp,
      now,
    )
    .run();
  return (await getEvent(db))!;
}

export async function getEvent(db: D1Database): Promise<EventRow | null> {
  return db
    .prepare("SELECT * FROM events WHERE id = ?")
    .bind(DEMO_EVENT_ID)
    .first<EventRow>();
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
    return (await getEvent(db))!;
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
  return results ?? [];
}

export async function listActiveBets(
  db: D1Database,
  eventId: string,
): Promise<BetRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM bets WHERE event_id = ? AND refunded = 0")
    .bind(eventId)
    .all<BetRow>();
  return results ?? [];
}

export function buildBoard(
  event: EventRow,
  horses: HorseRow[],
  bets: BetRow[],
  now = Date.now(),
): Board {
  const live = horses.filter((h) => h.scratched === 0);
  const realByHorse = new Map<string, number>();
  for (const b of bets) {
    if (b.refunded) continue;
    realByHorse.set(b.horse_id, (realByHorse.get(b.horse_id) ?? 0) + b.amount);
  }
  const realLive = live.map((h) => realByHorse.get(h.id) ?? 0);
  const realTotal = realLive.reduce((a, b) => a + b, 0);
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
  const wV = wVolume(realTotal, event.pull_e);
  const w = wCombined(wT, wV);
  const displays = seeds.map((s, i) => displayPool(s, w, realLive[i]));
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const seedTotal = seeds.reduce((a, b) => a + b, 0);

  const seedById = new Map<string, number>();
  const displayById = new Map<string, number>();
  live.forEach((h, i) => {
    seedById.set(h.id, seeds[i]);
    displayById.set(h.id, displays[i]);
  });

  const winner = live.find((h) => h.finish_place === 1) ?? null;
  const winnerReal = winner ? (realByHorse.get(winner.id) ?? 0) : 0;
  const winVoid = winner != null && winnerReal <= 0;

  const rows: HorseBoard[] = horses.map((h) => {
    const real = realByHorse.get(h.id) ?? 0;
    if (h.scratched) {
      return {
        horse: h,
        real,
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
      real,
      seed,
      display,
      referenceOdds: parimutuelOdds(display, displayTotal, event.takeout_d),
      confirmedOdds: parimutuelOdds(real, realTotal, event.takeout_d),
    };
  });

  return {
    event,
    wTime: wT,
    wVolume: wV,
    w,
    realTotal,
    seedTotal,
    displayTotal,
    horses: rows,
    winVoid,
    winnerId: winner?.id ?? null,
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

export async function upsertUser(
  db: D1Database,
  displayName: string,
  role: "member" | "admin",
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
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

export async function getUser(
  db: D1Database,
  userId: string,
): Promise<UserRow | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
}

/** デモ用投票画面の 10 人。管理者画面から代行投票する */
export const DEMO_MEMBER_NAMES = [
  "メンバー01",
  "メンバー02",
  "メンバー03",
  "メンバー04",
  "メンバー05",
  "メンバー06",
  "メンバー07",
  "メンバー08",
  "メンバー09",
  "メンバー10",
] as const;

export function isDemoMemberName(name: string): boolean {
  return (DEMO_MEMBER_NAMES as readonly string[]).includes(name);
}

export async function ensureDemoMembers(
  db: D1Database,
  event: EventRow,
): Promise<UserRow[]> {
  const out: UserRow[] = [];
  for (const name of DEMO_MEMBER_NAMES) {
    const user = await grantIfNeeded(db, event, await upsertUser(db, name, "member"));
    out.push(user);
  }
  return out;
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
  name: string,
  strength: number,
): Promise<string> {
  if (event.status !== "setup") {
    throw new Error("名簿は投票開始後は閉じます（飛び入り禁止）");
  }
  const trimmed = name.trim();
  if (!trimmed) throw new Error("名前を入れてください");
  if (!(strength >= 0)) throw new Error("相対評価点が不正です");
  const horses = await listHorses(db, event.id);
  const live = horses.filter((h) => h.scratched === 0).length;
  if (live >= MAX_LIVE_HORSES) {
    throw new Error(`デモの頭数は ${MAX_LIVE_HORSES} まで`);
  }
  const id = newId();
  await db
    .prepare(
      `INSERT INTO horses (
        id, event_id, name, strength, seed_source, scratched, sort_order, created_at
      ) VALUES (?, ?, ?, ?, 'manual', 0, ?, ?)`,
    )
      .bind(id, event.id, trimmed, strength, horses.length + 1, Date.now())
    .run();
  return id;
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
          id, event_id, name, strength, seed_source, scratched, sort_order, created_at
        ) VALUES (?, ?, ?, ?, 'manual', 0, ?, ?)`,
      )
      .bind(newId(), event.id, h.name, h.strength, i + 1, now),
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
  horseId: string,
  amount: number,
): Promise<void> {
  if (event.status !== "voting") throw new Error("投票期間外です");
  if (!Number.isFinite(amount) || amount < event.bet_unit || amount % event.bet_unit !== 0) {
    throw new Error(`最低単位は ${event.bet_unit} です`);
  }
  const horse = await db
    .prepare("SELECT * FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first<HorseRow>();
  if (!horse || horse.scratched) throw new Error("このウマ娘には投票できません");
  const fresh = await getUser(db, user.id);
  if (!fresh) throw new Error("ユーザーが見つかりません");
  if (amount > fresh.balance) throw new Error("残高が足りません");
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        "INSERT INTO bets (id, event_id, user_id, horse_id, amount, refunded, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
      )
      .bind(newId(), event.id, user.id, horseId, amount, now),
    db
      .prepare("UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?")
      .bind(amount, user.id, amount),
  ]);
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
  if (horse.scratched) return 0;
  const { results } = await db
    .prepare(
      "SELECT * FROM bets WHERE event_id = ? AND horse_id = ? AND refunded = 0",
    )
    .bind(event.id, horseId)
    .all<BetRow>();
  const bets = results ?? [];
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
  const bets = await listActiveBets(db, event.id);
  const board = buildBoard(event, horses, bets);
  const now = Date.now();
  const stmts = [];
  if (board.winVoid) {
    for (const b of bets) {
      stmts.push(
        db.prepare("UPDATE bets SET refunded = 1 WHERE id = ?").bind(b.id),
        db
          .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
          .bind(b.amount, b.user_id),
        db
          .prepare(
            "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'void', ?)",
          )
          .bind(newId(), event.id, b.user_id, b.id, b.amount, now),
      );
    }
  } else {
    const winnerId = board.winnerId!;
    const winnerRow = board.horses.find((h) => h.horse.id === winnerId);
    const odds = winnerRow?.confirmedOdds;
    if (odds == null) throw new Error("確定配当を計算できません");
    for (const b of bets) {
      if (b.horse_id !== winnerId) continue;
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
  },
): Promise<void> {
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
        voting_closes_at = ?
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
    .all<BetRow>();
  return results ?? [];
}

export async function resetDemo(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM payouts"),
    db.prepare("DELETE FROM bets"),
    db.prepare("DELETE FROM grants"),
    db.prepare("DELETE FROM horses"),
    db.prepare("DELETE FROM events"),
    db.prepare("UPDATE users SET balance = 0"),
  ]);
  await ensureEvent(db);
}
