/** 場内盤の表示用ヘルパー。ui.ts に依存しない（テストから直接読む） */
import { escapeHtml } from "./http.ts";

const STYLE_JA: Record<string, string> = {
  runner: "逃げ",
  leader: "先行",
  betweener: "差し",
  chaser: "追込",
};

export const VENUE_DIST_JA: Record<number, string> = {
  1: "短",
  2: "マイル",
  3: "中",
  4: "長",
};

export type VenueSlot = "day" | "dusk" | "night";

function formatOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

/** JST の時間帯。6–16 日中、16–19 夕方、それ以外ナイター */
export function venueSlotFromClock(now = Date.now()): VenueSlot {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(now));
  const h = Number(parts.find((x) => x.type === "hour")?.value ?? 0);
  if (h >= 6 && h < 16) return "day";
  if (h >= 16 && h < 19) return "dusk";
  return "night";
}

/** ?slot= があれば固定。無ければ時計 */
export function resolveVenueSlot(raw: string | null, now = Date.now()): VenueSlot {
  if (raw === "day" || raw === "dusk" || raw === "night") return raw;
  return venueSlotFromClock(now);
}

export function venueStyleLabel(styleKey: string | null | undefined): string {
  if (!styleKey) return "—";
  return STYLE_JA[styleKey] ?? "—";
}

export function venueHorseRowHtml(opts: {
  id: string;
  number: number;
  umaName: string;
  runnerName: string;
  styleLabel: string;
  odds: number | null;
}): string {
  const id = escapeHtml(opts.id);
  return `<div class="sheet-row" role="row" data-sel="${id}" data-horse-id="${id}">
    <span class="c-num" role="cell">${opts.number}</span>
    <span class="c-name" role="cell" title="${escapeHtml(opts.umaName)}">${escapeHtml(opts.umaName)}</span>
    <span class="c-runner" role="cell" title="${escapeHtml(opts.runnerName)}">${escapeHtml(opts.runnerName)}</span>
    <span class="c-style" role="cell">${escapeHtml(opts.styleLabel)}</span>
    <span class="c-odds" role="cell"><span class="odds-now">${formatOdds(opts.odds)}</span></span>
  </div>`;
}
