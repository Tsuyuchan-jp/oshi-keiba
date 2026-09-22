import {
  formatSelectionLabel,
  normalizeSelection,
  parseEnabledKinds,
  type BetKind,
} from "./bets";
import { exoticReferenceOdds, parimutuelOdds } from "./odds";
import type { Board, PoolCombo } from "./storeTypes";

export type VenueOddsItem = {
  key: string;
  label: string;
  numbers: number[];
  odds: number | null;
};

export type VenueOrderedMarket = {
  kind: "umatan" | "sanrentan";
  enabled: boolean;
  popular: VenueOddsItem[];
  recent: VenueOddsItem[];
};

export type VenueOddsResponse =
  | { view: "win"; enabled: true; items: VenueOddsItem[] }
  | { view: "umaren" | "sanrenpuku"; enabled: boolean; axis: number | null; items: VenueOddsItem[] }
  | { view: "ordered"; markets: VenueOrderedMarket[] };

type Candidate = {
  ids: string[];
  numbers: number[];
  key: string;
  label: string;
};

function liveEntries(board: Board) {
  return board.horses.filter((entry) => !entry.horse.scratched && entry.number > 0);
}

function candidate(
  kind: Exclude<BetKind, "win">,
  ids: string[],
  numbers: number[],
  numberById: Map<string, number>,
): Candidate {
  const normalized = normalizeSelection(kind, ids);
  return {
    ids,
    numbers,
    key: normalized.selection_key,
    label: formatSelectionLabel(
      kind,
      normalized.horse_1,
      normalized.horse_2,
      normalized.horse_3,
      numberById,
    ),
  };
}

function candidatesFor(
  board: Board,
  kind: Exclude<BetKind, "win">,
  axisNumber?: number,
): Candidate[] {
  const live = liveEntries(board);
  const numberById = new Map(live.map((entry) => [entry.horse.id, entry.number]));
  const output: Candidate[] = [];
  if (kind === "umaren" || kind === "umatan") {
    for (let a = 0; a < live.length; a += 1) {
      for (let b = 0; b < live.length; b += 1) {
        if (a === b || (kind === "umaren" && a > b)) continue;
        output.push(candidate(
          kind,
          [live[a]!.horse.id, live[b]!.horse.id],
          [live[a]!.number, live[b]!.number],
          numberById,
        ));
      }
    }
    return output;
  }
  for (let a = 0; a < live.length; a += 1) {
    for (let b = 0; b < live.length; b += 1) {
      if (b === a) continue;
      for (let c = 0; c < live.length; c += 1) {
        if (c === a || c === b) continue;
        if (kind === "sanrenpuku" && !(a < b && b < c)) continue;
        const numbers = [live[a]!.number, live[b]!.number, live[c]!.number];
        if (kind === "sanrenpuku" && axisNumber != null && !numbers.includes(axisNumber)) continue;
        output.push(candidate(
          kind,
          [live[a]!.horse.id, live[b]!.horse.id, live[c]!.horse.id],
          numbers,
          numberById,
        ));
      }
    }
  }
  return output;
}

function compareNumbers(a: readonly number[], b: readonly number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function itemsFor(
  board: Board,
  kind: Exclude<BetKind, "win">,
  candidates: Candidate[],
): Array<VenueOddsItem & { lastBetAt: number | null }> {
  const live = liveEntries(board);
  const indexById = new Map(live.map((entry, index) => [entry.horse.id, index]));
  const pool = board.pools.find((entry) => entry.kind === kind);
  const comboByKey = new Map<string, PoolCombo>(pool?.combos.map((combo) => [combo.selection_key, combo]) ?? []);
  const votingLike = board.event.status === "setup" || board.event.status === "voting";
  return candidates.map((entry) => {
    const combo = comboByKey.get(entry.key);
    const odds = votingLike
      ? exoticReferenceOdds({
          kind,
          strengths: live.map((item) => item.horse.strength),
          selection: entry.ids.map((id) => indexById.get(id)!),
          seedPool: board.event.seed_pool_s,
          timeWeight: board.wTime,
          realTotal: pool?.realTotal ?? 0,
          selectionReal: combo?.real ?? 0,
          takeoutD: board.event.takeout_d,
        })
      : parimutuelOdds(combo?.real ?? 0, pool?.realTotal ?? 0, board.event.takeout_d);
    return {
      key: entry.key,
      label: entry.label,
      numbers: entry.numbers,
      odds,
      lastBetAt: combo?.lastBetAt ?? null,
    };
  });
}

function orderedMarket(board: Board, kind: "umatan" | "sanrentan"): VenueOrderedMarket {
  const enabled = parseEnabledKinds(board.event.enabled_kinds).includes(kind);
  if (!enabled) return { kind, enabled, popular: [], recent: [] };
  const items = itemsFor(board, kind, candidatesFor(board, kind));
  const popular = [...items]
    .sort((a, b) => {
      if (a.odds == null && b.odds != null) return 1;
      if (a.odds != null && b.odds == null) return -1;
      const oddsDifference = (a.odds ?? 0) - (b.odds ?? 0);
      return oddsDifference || compareNumbers(a.numbers, b.numbers);
    })
    .slice(0, 9);
  const recent = items
    .filter((item) => item.lastBetAt != null)
    .sort((a, b) => (b.lastBetAt! - a.lastBetAt!) || compareNumbers(a.numbers, b.numbers))
    .slice(0, 9);
  return { kind, enabled, popular, recent };
}

export function venueOddsResponse(
  board: Board,
  view: "win" | "umaren" | "sanrenpuku" | "ordered",
  axisNumber?: number,
): VenueOddsResponse {
  const live = liveEntries(board);
  if (view === "win") {
    const votingLike = board.event.status === "setup" || board.event.status === "voting";
    return {
      view,
      enabled: true,
      items: live.map((entry) => ({
        key: entry.horse.id,
        label: String(entry.number),
        numbers: [entry.number],
        odds: votingLike ? entry.referenceOdds : entry.confirmedOdds,
      })),
    };
  }
  if (view === "ordered") {
    return { view, markets: [orderedMarket(board, "umatan"), orderedMarket(board, "sanrentan")] };
  }
  const enabled = parseEnabledKinds(board.event.enabled_kinds).includes(view);
  const axis = view === "sanrenpuku"
    ? (live.some((entry) => entry.number === axisNumber) ? axisNumber! : (live[0]?.number ?? null))
    : null;
  return {
    view,
    enabled,
    axis,
    items: enabled ? itemsFor(board, view, candidatesFor(board, view, axis ?? undefined)) : [],
  };
}
