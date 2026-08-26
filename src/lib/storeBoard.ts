/**
 * store ボード（参考・確定オッズ集計）
 */

import { winningKey, type BetKind } from "./bets";
import {
  allocateSeed,
  displayPool,
  addImputed,
  IMPUTED_LAMBDA,
  parimutuelOdds,
  referenceTv,
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
