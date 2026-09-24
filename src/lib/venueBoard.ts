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
  if (n >= 9999.9) return "9999.9+";
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
  const podium = place != null && place >= 1 && place <= 3 ? ` place-${place}` : "";
  const placeText = place != null ? `${place}着` : "";
  return `<div class="sheet-row" role="row" data-sel="${id}" data-horse-id="${id}">
    <span class="c-num" role="cell">${opts.number}</span>
    <span class="c-name" role="cell" title="${escapeHtml(opts.umaName)}">${escapeHtml(opts.umaName)}</span>
    <span class="c-runner" role="cell" title="${escapeHtml(opts.runnerName)}">${escapeHtml(opts.runnerName)}</span>
    <span class="c-style" role="cell">${escapeHtml(opts.styleLabel)}</span>
    <span class="c-odds" role="cell"><span class="odds-now">${formatOdds(opts.odds)}</span></span>
    <span class="c-place${podium}" role="cell">${placeText}</span>
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

/** 公開後の特払い注。成立分は書かない。賭式名は列挙し説明は1回 */
export function formatVenuePublishedHint(specialLabels: string[]): string {
  if (!specialLabels.length) return "";
  return `${specialLabels.join("・")}は特払いです。当たりに投票がなかったため、使ったスペの8割が戻ります。`;
}

const ROMAN = ["", "I", "II", "III", "IV", "V"] as const;

/** 確定盤のローマ数字。1〜5着だけ */
export function venuePlaceRoman(place: number): string {
  if (place < 1 || place > 5) return "";
  return ROMAN[place]!;
}

/** 確定盤の1行。大きなウマ番の右にウマ娘名（細字） */
export function venueFinishRowHtml(opts: {
  place: number;
  number: number;
  umaName: string;
}): string {
  const roman = venuePlaceRoman(opts.place);
  const name = escapeHtml(opts.umaName);
  return `<div class="fin-row"><span class="fin-rk">${roman}</span><span class="fin-n">${opts.number}</span><span class="fin-uma" title="${name}">${name}</span></div>`;
}

/** 払戻盤の賭式チップ用クラス（モックの trio / trif に合わせる） */
export function venuePayKindClass(kind: string): string {
  if (kind === "sanrenpuku") return "trio";
  if (kind === "sanrentan") return "trif";
  return kind;
}

function paddockCta(label: string): string {
  return `<a class="paddock-cta" href="/paddock">${escapeHtml(label)}</a>`;
}

function umabashiraCta(show: boolean | undefined): string {
  return show
    ? `<button class="umabashira-cta" type="button" id="umabashira-open">ウマ柱を見る</button>`
    : "";
}

/** 場内足元。パドック導線がある間はウマ柱も出す。結果公開後は出さない */
export function venueFootHtml(opts: {
  status: "setup" | "voting" | "closed" | "published";
  ctaHref: string;
  closedHint: string;
  publishedHint: string;
  showUmabashira?: boolean;
  /** 投票締切中に出す馬券導線。未ログイン時はログインへ向ける */
  showClosedTicketLink?: boolean;
  closedTicketNeedsLogin?: boolean;
}): string {
  if (opts.status === "published") {
    return `<div class="foot"><span class="hint" id="phase-hint">${escapeHtml(opts.publishedHint)}</span></div>`;
  }
  if (opts.status === "closed") {
    const ticketHref = opts.closedTicketNeedsLogin ? "/login" : "/tickets";
    const ticketLabel = "自分の馬券を見る";
    const actions = opts.showClosedTicketLink
      ? `<div class="foot-browse closed-ticket-browse">${umabashiraCta(opts.showUmabashira)}<div class="foot-actions closed-ticket-actions">${paddockCta("パドックを見る")}<a class="cta closed-ticket-cta" href="${ticketHref}">${ticketLabel}</a></div></div>`
      : `<div class="foot-browse">${umabashiraCta(opts.showUmabashira)}${paddockCta("出走馬をパドックで見る")}</div>`;
    return `<div class="foot"><span class="hint" id="phase-hint">${escapeHtml(opts.closedHint)}</span>${actions}</div>`;
  }
  if (opts.status === "setup") {
    return `<div class="foot"><span class="hint" id="phase-hint">投票開始までお待ちください。</span><div class="foot-browse">${umabashiraCta(opts.showUmabashira)}${paddockCta("出走馬をパドックで見る")}</div></div>`;
  }
  return `<div class="foot"><div class="foot-voting">${umabashiraCta(opts.showUmabashira)}<div class="foot-actions">${paddockCta("パドックを見る")}<a class="cta" href="${escapeHtml(opts.ctaHref)}">馬券を買う</a></div></div></div>`;
}
