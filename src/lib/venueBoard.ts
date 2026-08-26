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
  /** 公開の全頭表だけ。着列用 */
  place?: number | null;
}): string {
  const id = escapeHtml(opts.id);
  const place = opts.place != null ? opts.place : null;
  const placeClass =
    place != null && place >= 1 && place <= 3 ? ` place-${place}` : "";
  const placeText = place != null ? String(place) : "";
  return `<div class="sheet-row${placeClass}" role="row" data-sel="${id}" data-horse-id="${id}">
    <span class="c-num" role="cell">${opts.number}</span>
    <span class="c-name" role="cell" title="${escapeHtml(opts.umaName)}">${escapeHtml(opts.umaName)}</span>
    <span class="c-runner" role="cell" title="${escapeHtml(opts.runnerName)}">${escapeHtml(opts.runnerName)}</span>
    <span class="c-style" role="cell">${escapeHtml(opts.styleLabel)}</span>
    <span class="c-odds" role="cell"><span class="odds-now">${formatOdds(opts.odds)}</span></span>
    <span class="c-place" role="cell">${placeText}</span>
  </div>`;
}

/** 締切盤の注。着は出さない。成立／特払いが分かるときだけ先に書く */
export function formatVenueClosedHint(okLabels: string[], specialLabels: string[]): string {
  const parts: string[] = [];
  if (okLabels.length) parts.push(`${okLabels.join("・")}は成立予定です。`);
  if (specialLabels.length) {
    parts.push(
      `${specialLabels.join("・")}は特払い予定です。この賭式に使ったスペの8割が戻ります。`,
    );
  }
  parts.push("着順はまだ出ません。");
  return parts.join("");
}

/** 公開後の特払い注。成立分は書かない */
export function formatVenuePublishedHint(specialLabels: string[]): string {
  return specialLabels
    .map(
      (l) =>
        `${l}は当たりの組み合わせに投票がなかったため、特払いです。この賭式に使ったスペの8割が戻ります。`,
    )
    .join("");
}

const ROMAN = ["", "I", "II", "III", "IV", "V"] as const;

/** 確定盤のローマ数字。1〜5着だけ */
export function venuePlaceRoman(place: number): string {
  if (place < 1 || place > 5) return "";
  return ROMAN[place]!;
}

/** 払戻盤の賭式チップ用クラス（モックの trio / trif に合わせる） */
export function venuePayKindClass(kind: string): string {
  if (kind === "sanrenpuku") return "trio";
  if (kind === "sanrentan") return "trif";
  return kind;
}
