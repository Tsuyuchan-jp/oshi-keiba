import {
  normalizeSelection,
  parseEnabledKinds,
  type BetKind,
} from "./bets";
import { exoticOddsQuote, exoticReferenceOdds, isOddsV4, parimutuelOdds, seedForKind } from "./odds";
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

export type ExoticCandidate = {
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
): ExoticCandidate {
  const normalized = normalizeSelection(kind, ids);
  const separator = kind === "umatan" || kind === "sanrentan" ? "→" : "-";
  return {
    ids,
    numbers,
    key: normalized.selection_key,
    label: numbers.join(separator),
  };
}

export function exoticCandidatesFor(
  board: Board,
  kind: Exclude<BetKind, "win">,
  axisNumber?: number,
): ExoticCandidate[] {
  const live = liveEntries(board);
  const output: ExoticCandidate[] = [];
  if (kind === "umaren" || kind === "umatan") {
    for (let a = 0; a < live.length; a += 1) {
      for (let b = 0; b < live.length; b += 1) {
        if (a === b || (kind === "umaren" && a > b)) continue;
        output.push(candidate(
          kind,
          [live[a]!.horse.id, live[b]!.horse.id],
          [live[a]!.number, live[b]!.number],
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

export function shownExoticOdds(
  board: Board,
  kind: Exclude<BetKind, "win">,
  ids: string[],
  selectionReal: number,
): number | null {
  const live = liveEntries(board);
  const indexById = new Map(live.map((entry, index) => [entry.horse.id, index]));
  if (ids.some((id) => !indexById.has(id))) return null;
  const pool = board.pools.find((entry) => entry.kind === kind);
  const realTotal = pool?.realTotal ?? 0;
  const strengths = live.map((item) => item.horse.strength);
  const selection = ids.map((id) => indexById.get(id)!);
  if (isOddsV4(board.event)) {
    return exoticOddsQuote({
      kind,
      strengths,
      selection,
      seedPool: seedForKind(board.event, kind),
      realTotal,
      selectionReal,
      takeoutD: board.event.takeout_d,
    })?.odds ?? null;
  }
  const votingLike = board.event.status === "setup" || board.event.status === "voting";
  if (!votingLike) return parimutuelOdds(selectionReal, realTotal, board.event.takeout_d);
  return exoticReferenceOdds({
    kind,
    strengths,
    selection,
    seedPool: board.event.seed_pool_s,
    timeWeight: board.wTime,
    realTotal,
    selectionReal,
    takeoutD: board.event.takeout_d,
  });
}

function itemsFor(
  board: Board,
  kind: Exclude<BetKind, "win">,
  candidates: ExoticCandidate[],
): Array<VenueOddsItem & { lastBetAt: number | null }> {
  const pool = board.pools.find((entry) => entry.kind === kind);
  const comboByKey = new Map<string, PoolCombo>(pool?.combos.map((combo) => [combo.selection_key, combo]) ?? []);
  return candidates.map((entry) => {
    const combo = comboByKey.get(entry.key);
    const odds = shownExoticOdds(board, kind, entry.ids, combo?.real ?? 0);
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
  const items = itemsFor(board, kind, exoticCandidatesFor(board, kind));
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
    items: enabled ? itemsFor(board, view, exoticCandidatesFor(board, view, axis ?? undefined)) : [],
  };
}
