/**
 * store ボード（参考・確定オッズ集計）
 */

import { normalizeSelection, winningKey, type BetKind } from "./bets";
import {
  allocateSeed,
  displayPool,
  addImputed,
  exoticOddsQuote,
  IMPUTED_LAMBDA,
  isOddsV4,
  parimutuelOdds,
  referenceTv,
  seedForKind,
  wCombined,
  wTime,
  wVolume,
} from "./odds";
import { ensureEvent, maybeAutoClose } from "./storeEvent";
import { listActiveBets, listHorses } from "./storeRead";
import type {
  BetRow,
  Board,
  EventRow,
  HorseBoard,
  HorseRow,
  KindPool,
  PoolCombo,
} from "./storeTypes";

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
    { horse_1: string; horse_2: string | null; horse_3: string | null; real: number; lastBetAt: number }
  >();
  for (const b of kindBets) {
    const cur = byKey.get(b.selection_key);
    if (cur) {
      cur.real += b.amount;
      cur.lastBetAt = Math.max(cur.lastBetAt, b.created_at);
    } else {
      byKey.set(b.selection_key, {
        horse_1: b.horse_1,
        horse_2: b.horse_2,
        horse_3: b.horse_3,
        real: b.amount,
        lastBetAt: b.created_at,
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
      lastBetAt: v.lastBetAt,
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

function winningIds(kind: BetKind, horses: HorseRow[]): string[] | null {
  const byPlace = new Map<number, string>();
  for (const horse of horses) {
    if (horse.scratched || horse.finish_place == null) continue;
    byPlace.set(horse.finish_place, horse.id);
  }
  const first = byPlace.get(1);
  if (!first) return null;
  if (kind === "win") return [first];
  const second = byPlace.get(2);
  if (!second) return null;
  if (kind === "umaren" || kind === "umatan") return [first, second];
  const third = byPlace.get(3);
  if (!third) return null;
  return [first, second, third];
}

function v4SelectionOdds(
  kind: BetKind,
  horses: HorseRow[],
  ids: string[],
  real: number,
  realTotal: number,
  event: EventRow,
): number | null {
  const live = horses.filter((horse) => horse.scratched === 0);
  if (kind === "win") {
    const seeds = allocateSeed(live.map((horse) => horse.strength), event.seed_pool_s);
    const index = live.findIndex((horse) => horse.id === ids[0]);
    const seed = index >= 0 ? seeds[index]! : 0;
    return parimutuelOdds(seed + real, event.seed_pool_s + realTotal, event.takeout_d);
  }
  const indexById = new Map(live.map((horse, index) => [horse.id, index]));
  if (ids.some((id) => !indexById.has(id))) return null;
  return exoticOddsQuote({
    kind,
    strengths: live.map((horse) => horse.strength),
    selection: ids.map((id) => indexById.get(id)!),
    seedPool: seedForKind(event, kind),
    realTotal,
    selectionReal: real,
    takeoutD: event.takeout_d,
  })?.odds ?? null;
}

function buildBoardV4(
  event: EventRow,
  horses: HorseRow[],
  bets: BetRow[],
): Board {
  const live = horses.filter((horse) => horse.scratched === 0);
  const winBets = bets.filter((bet) => !bet.refunded && bet.kind === "win");
  const realByHorse = new Map<string, number>();
  for (const bet of winBets) {
    realByHorse.set(bet.horse_1, (realByHorse.get(bet.horse_1) ?? 0) + bet.amount);
  }
  const realLive = live.map((horse) => realByHorse.get(horse.id) ?? 0);
  const realTotal = realLive.reduce((sum, amount) => sum + amount, 0);
  const seeds = allocateSeed(live.map((horse) => horse.strength), event.seed_pool_s);
  const seedById = new Map<string, number>();
  live.forEach((horse, index) => seedById.set(horse.id, seeds[index] ?? 0));
  let exoticTotal = 0;
  for (const bet of bets) {
    if (bet.refunded || bet.kind === "win") continue;
    exoticTotal += bet.amount;
  }

  let number = 0;
  const rows: HorseBoard[] = horses.map((horse) => {
    if (!horse.scratched) number += 1;
    const real = realByHorse.get(horse.id) ?? 0;
    if (horse.scratched) {
      return {
        horse,
        number: 0,
        real,
        imputed: 0,
        seed: 0,
        display: 0,
        referenceOdds: null,
        confirmedOdds: null,
      };
    }
    const seed = seedById.get(horse.id) ?? 0;
    const odds = parimutuelOdds(seed + real, event.seed_pool_s + realTotal, event.takeout_d);
    return {
      horse,
      number,
      real,
      imputed: 0,
      seed,
      display: seed + real,
      referenceOdds: odds,
      confirmedOdds: odds,
    };
  });

  const pools = (["win", "umaren", "umatan", "sanrenpuku", "sanrentan"] as BetKind[]).map((kind) => {
    const kindBets = bets.filter((bet) => !bet.refunded && bet.kind === kind);
    const byKey = new Map<string, PoolCombo>();
    for (const bet of kindBets) {
      const current = byKey.get(bet.selection_key);
      if (current) {
        current.real += bet.amount;
        current.lastBetAt = Math.max(current.lastBetAt ?? 0, bet.created_at);
      } else {
        byKey.set(bet.selection_key, {
          selection_key: bet.selection_key,
          horse_1: bet.horse_1,
          horse_2: bet.horse_2,
          horse_3: bet.horse_3,
          real: bet.amount,
          lastBetAt: bet.created_at,
          odds: null,
        });
      }
    }
    const ids = winningIds(kind, horses);
    if (ids) {
      const picked = normalizeSelection(kind, ids);
      if (!byKey.has(picked.selection_key)) {
        byKey.set(picked.selection_key, {
          selection_key: picked.selection_key,
          horse_1: picked.horse_1,
          horse_2: picked.horse_2,
          horse_3: picked.horse_3,
          real: 0,
          lastBetAt: null,
          odds: null,
        });
      }
    }
    const realKindTotal = [...byKey.values()].reduce((sum, combo) => sum + combo.real, 0);
    const combos = [...byKey.values()].map((combo) => {
      const picked = [combo.horse_1, combo.horse_2, combo.horse_3].filter((id): id is string => id != null);
      return {
        ...combo,
        odds: kind === "win"
          ? rows.find((row) => row.horse.id === combo.horse_1)?.confirmedOdds ?? null
          : v4SelectionOdds(kind, horses, picked, combo.real, realKindTotal, event),
      };
    }).sort((a, b) => b.real - a.real);
    const winKey = ids ? normalizeSelection(kind, ids).selection_key : null;
    if (kind === "win") {
      const listed = new Set(combos.map((combo) => combo.selection_key));
      for (const row of rows) {
        if (row.horse.scratched || listed.has(row.horse.id)) continue;
        combos.push({
          selection_key: row.horse.id,
          horse_1: row.horse.id,
          horse_2: null,
          horse_3: null,
          real: row.real,
          lastBetAt: null,
          odds: row.confirmedOdds,
        });
      }
    }
    return {
      kind,
      realTotal: realKindTotal,
      combos,
      winningKey: winKey,
      voidSpecial: winKey == null ? null : false,
    };
  });

  return {
    event,
    wTime: 1,
    wVolume: 1,
    w: 1,
    realTotal,
    exoticTotal,
    tv: realTotal,
    seedTotal: event.seed_pool_s,
    displayTotal: event.seed_pool_s + realTotal,
    horses: rows,
    pools,
  };
}

export type PublishedKindResult = {
  kind: string;
  winning_key: string;
  odds: number | null;
  payout_total: number;
};

/** 公開後は、保存した当たり倍率を板へ戻す。後から式を変えても払った数字は動かさない。 */
export function applyPublishedKindResults(board: Board, rows: readonly PublishedKindResult[]): void {
  for (const saved of rows) {
    const pool = board.pools.find((item) => item.kind === saved.kind);
    if (!pool || saved.odds == null) continue;
    pool.winningKey = saved.winning_key;
    const combo = pool.combos.find((item) => item.selection_key === saved.winning_key);
    if (combo) combo.odds = saved.odds;
    if (saved.kind === "win") {
      const horse = board.horses.find((item) => item.horse.id === saved.winning_key);
      if (horse) {
        horse.referenceOdds = saved.odds;
        horse.confirmedOdds = saved.odds;
      }
    }
  }
}

function buildLegacyBoard(
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
        lastBetAt: null,
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
        lastBetAt: null,
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

export function buildBoard(
  event: EventRow,
  horses: HorseRow[],
  bets: BetRow[],
  now = Date.now(),
): Board {
  return isOddsV4(event) ? buildBoardV4(event, horses, bets) : buildLegacyBoard(event, horses, bets, now);
}

export async function loadBoard(
  db: D1Database,
  archiveBucket?: R2Bucket,
  now = Date.now(),
): Promise<Board> {
  let event = await ensureEvent(db);
  event = await maybeAutoClose(db, event, now, archiveBucket);
  const [horses, bets] = await Promise.all([
    listHorses(db, event.id),
    listActiveBets(db, event.id),
  ]);
  const board = buildBoard(event, horses, bets, now);
  if (event.status === "published" && isOddsV4(event)) {
    const saved = await db
      .prepare("SELECT kind, winning_key, odds, payout_total FROM event_kind_results WHERE event_id = ?")
      .bind(event.id)
      .all<PublishedKindResult>();
    applyPublishedKindResults(board, saved.results ?? []);
  }
  return board;
}

export function numberByHorseId(board: Board): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of board.horses) {
    if (!h.horse.scratched && h.number > 0) m.set(h.horse.id, h.number);
  }
  return m;
}
