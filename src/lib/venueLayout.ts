/**
 * 場内の投票中・締切・結果公開。HTML 構造・クラスはモック、name / 既存 id・挙動は本番。
 */
import { escapeHtml } from "./http.ts";
import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { horseSheetParts } from "./horseName.ts";
import {
  BET_KIND_LABEL,
  BET_KINDS,
  formatSelectionLabel,
  parseEnabledKinds,
  type BetKind,
} from "./bets.ts";
import {
  getScoreCourse,
  GROUND_CONDITION_OPTIONS,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from "./scoreSetup.ts";
import {
  eventScoreSetup,
  numberByHorseId,
  type BetRow,
  type Board,
  type UserRow,
} from "./store.ts";
import {
  flashHtml,
  formatOddsWithUnit,
  formatPt,
  howToModal,
  toJstInput,
} from "./ui.ts";
import {
  formatVenueClosedHint,
  formatVenuePublishedHint,
  venueFinishRowHtml,
  venueHorseRowHtml,
  venuePayKindClass,
  venueStyleLabel,
  venueFootHtml,
  type VenueSlot,
} from "./venueBoard.ts";
import { VENUE_CSS } from "./venueCss.ts";
import { backgroundModal, chromeTimesHtml, memberMoreScript, memberOutLinks } from "./memberShell.ts";
import { memberUmabashiraModalHtml, memberUmabashiraScript } from "./memberUmabashira.ts";
import { wakuOf } from "./umabashiraWaku.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";
import {
  venueOddsResponse,
  type VenueOddsItem,
  type VenueOddsResponse,
  type VenueOrderedMarket,
} from "./venueOdds.ts";

export type { VenueSlot };
export { resolveVenueSlot } from "./venueBoard.ts";

export type VenueOddsPreviewLayout = "three" | "five" | "jra";

export function venueCloseHm(ms: number | null): string {
  const t = toJstInput(ms);
  return t ? t.slice(11, 16) : "—";
}

/** 盤見出し。評価点の記号は出さない。芝・稍重は開催条件の見た目 */
export function venueBoardHead(board: Board): string {
  return venueBoardHeadParts(board).join("　");
}

function venueBoardHeadParts(board: Board): string[] {
  const bits = [board.event.title];
  const setup = eventScoreSetup(board.event);
  if (setup) {
    const course = getScoreCourse(setup.conditions.courseKey);
    if (course) {
      const surface =
        course.groundType === 2 ? "ダート" : course.groundType === 1 ? "芝" : "";
      if (course.place) bits.push(course.place);
      if (course.courseDistance) bits.push(`${course.courseDistance}m`);
      if (surface) bits.push(surface);
    }
    const season = SEASON_OPTIONS.find((o) => o.value === setup.conditions.season);
    if (season) bits.push(season.label);
    const weather = WEATHER_OPTIONS.find((o) => o.value === setup.conditions.weather);
    if (weather) bits.push(weather.label);
    const g = GROUND_CONDITION_OPTIONS.find(
      (o) => o.value === setup.conditions.groundCondition,
    );
    if (g) bits.push(g.label);
  }
  return bits;
}

export function venueWinSheetRows(board: Board): string {
  const showPlace = board.event.status === "published";
  return board.horses
    .filter((h) => !h.horse.scratched)
    .map((h) => {
      const parts = horseSheetParts(h.horse);
      const input = parseHorseScoreInput(h.horse.score_input);
      return venueHorseRowHtml({
        id: h.horse.id,
        number: h.number,
        umaName: parts.umaName,
        runnerName: parts.runnerName,
        styleLabel: venueStyleLabel(input?.styleKey),
        odds:
          board.event.status === "voting" || board.event.status === "setup"
            ? h.referenceOdds
            : h.confirmedOdds,
        place: showPlace ? h.horse.finish_place : null,
      });
    })
    .join("");
}

export function venueClosedHint(board: Board): string {
  const enabled = new Set(parseEnabledKinds(board.event.enabled_kinds));
  const ok: string[] = [];
  const spe: string[] = [];
  for (const k of BET_KINDS) {
    if (!enabled.has(k)) continue;
    const p = board.pools.find((x) => x.kind === k);
    if (!p || p.voidSpecial == null) continue;
    if (p.voidSpecial) spe.push(BET_KIND_LABEL[k]);
    else ok.push(BET_KIND_LABEL[k]);
  }
  return formatVenueClosedHint(ok, spe);
}

export function venuePublishedHint(board: Board): string {
  const enabled = new Set(parseEnabledKinds(board.event.enabled_kinds));
  const spe: string[] = [];
  for (const k of BET_KINDS) {
    if (!enabled.has(k)) continue;
    const p = board.pools.find((x) => x.kind === k);
    if (p?.voidSpecial) spe.push(BET_KIND_LABEL[k]);
  }
  return formatVenuePublishedHint(spe);
}

/** 払戻盤の1行。特払いは買い目 —・特払い 8割戻し */
export function venuePayRowHtml(opts: {
  kind: BetKind;
  selection: string;
  oddsText: string;
  voidSpecial: boolean;
}): string {
  const cls = venuePayKindClass(opts.kind);
  const sel = opts.voidSpecial ? "—" : opts.selection;
  const amt = opts.voidSpecial
    ? `<span class="pay-amt void">特払い 8割戻し</span>`
    : `<span class="pay-amt">${escapeHtml(opts.oddsText)}</span>`;
  return `<div class="pay-row">
    <span class="pay-k ${escapeHtml(cls)}">${escapeHtml(BET_KIND_LABEL[opts.kind])}</span>
    <span class="pay-sel">${escapeHtml(sel)}</span>
    ${amt}
  </div>`;
}

export function venuePayBoardHtml(board: Board): string {
  const nums = numberByHorseId(board);
  const enabled = new Set(parseEnabledKinds(board.event.enabled_kinds));
  const rows = BET_KINDS.filter((k) => enabled.has(k))
    .map((k) => {
      const pool = board.pools.find((p) => p.kind === k);
      const voidSpecial = !!pool?.voidSpecial;
      let selection = "—";
      let oddsText = "—";
      if (pool?.winningKey && !voidSpecial) {
        const combo = pool.combos.find((c) => c.selection_key === pool.winningKey);
        if (combo) {
          selection = formatSelectionLabel(
            k,
            combo.horse_1,
            combo.horse_2,
            combo.horse_3,
            nums,
          );
          oddsText = formatOddsWithUnit(combo.odds);
        } else if (k === "win") {
          const h = board.horses.find((x) => x.horse.id === pool.winningKey);
          if (h) {
            selection = String(h.number);
            oddsText = formatOddsWithUnit(h.confirmedOdds);
          }
        }
      }
      return venuePayRowHtml({ kind: k, selection, oddsText, voidSpecial });
    })
    .join("");
  return `<article class="j-panel j-pay" aria-label="払戻">
    <div class="j-head"><span>${escapeHtml(board.event.title)}</span><span>払戻</span></div>
    <div class="j-body">${rows}</div>
  </article>`;
}

export function venueFinishBoardHtml(board: Board): string {
  const top = board.horses
    .filter((h) => !h.horse.scratched && h.horse.finish_place != null)
    .sort((a, b) => (a.horse.finish_place ?? 0) - (b.horse.finish_place ?? 0))
    .slice(0, 5);
  const rows = top
    .map((h) => {
      const place = h.horse.finish_place!;
      return venueFinishRowHtml({
        place,
        number: h.number,
        umaName: horseSheetParts(h.horse).umaName,
      });
    })
    .join("");
  const setup = eventScoreSetup(board.event);
  let foot = "";
  if (setup) {
    const course = getScoreCourse(setup.conditions.courseKey);
    const surface =
      course?.groundType === 2 ? "ダート" : course?.groundType === 1 ? "芝" : "";
    const g = GROUND_CONDITION_OPTIONS.find(
      (o) => o.value === setup.conditions.groundCondition,
    );
    if (surface || g) {
      foot = `<div class="fin-foot"><div>${escapeHtml(surface || "バ場")}${g ? ` <b>${escapeHtml(g.label)}</b>` : ""}</div></div>`;
    }
  }
  return `<article class="j-panel j-fin" aria-label="確定着順">
    <div class="fin-top">
      <span class="fin-place">本戦</span>
      <span class="fin-r"></span>
      <span class="kakutei">確定</span>
    </div>
    <div class="j-body">
      <div class="fin-rows">${rows}</div>
      ${foot}
    </div>
  </article>`;
}

export function venueTicketResult(
  bet: BetRow,
  pay: { kind: string; amount: number } | undefined,
): { text: string; hit: boolean } {
  if (bet.refunded && pay?.kind === "refund") {
    return { text: "取消（全額戻し）", hit: false };
  }
  if (bet.refunded && pay?.kind === "redo") {
    return { text: "やりなおし", hit: false };
  }
  if (pay?.kind === "special") {
    return { text: "特払い（8割戻し）", hit: false };
  }
  if (pay?.kind === "win") {
    return { text: `的中 ${formatPt(pay.amount)}`, hit: true };
  }
  if (bet.refunded) return { text: "返還", hit: false };
  return { text: "外れ", hit: false };
}

export function venueTicketsHtml(
  bets: BetRow[],
  payouts: { bet_id: string; amount: number; kind: string }[],
  board: Board,
): string {
  if (bets.length === 0) {
    return `<div class="tickets" id="tickets">
      <div class="tickets-h">自分の馬券</div>
      <div class="t-row"><span class="lab">なし</span><span class="yen"></span><span class="res"></span></div>
    </div>`;
  }
  const payByBet = new Map(payouts.map((p) => [p.bet_id, p]));
  const nums = numberByHorseId(board);
  const rows = bets
    .map((b) => {
      const label = `${BET_KIND_LABEL[b.kind]} ${formatSelectionLabel(b.kind, b.horse_1, b.horse_2, b.horse_3, nums)}`;
      const res = venueTicketResult(b, payByBet.get(b.id));
      return `<div class="t-row">
        <span class="lab">${escapeHtml(label)}</span>
        <span class="yen">${escapeHtml(formatPt(b.amount))}</span>
        <span class="res${res.hit ? " hit" : ""}">${escapeHtml(res.text)}</span>
      </div>`;
    })
    .join("");
  return `<div class="tickets" id="tickets">
    <div class="tickets-h">自分の馬券</div>
    ${rows}
  </div>`;
}

function sheetHeadHtml(withPlace: boolean): string {
  const place = withPlace
    ? `<span class="c-place" role="columnheader">着</span>`
    : `<span class="c-place" role="columnheader"></span>`;
  return `<div class="sheet-row head" role="row">
    <span class="c-num" role="columnheader">#</span>
    <span class="c-name" role="columnheader">ウマ娘</span>
    <span class="c-runner" role="columnheader">トレーナー</span>
    <span class="c-style" role="columnheader">脚質</span>
    <span class="c-odds" role="columnheader">オッズ</span>
    ${place}
  </div>`;
}

/** ローカル表示試作だけの連勝盤。単勝盤は既存の sheet をそのまま使う。 */
function legacyPreviewMarketPanelHtml(
  board: Board,
  kind: Exclude<BetKind, "win">,
  title: string,
  mode: "popular" | "real" = "popular",
): string {
  const nums = board.horses.filter((h) => !h.horse.scratched).map((h) => h.number);
  const n = (i: number) => String(nums[i % nums.length] ?? "?");
  const selections = kind === "umaren"
    ? [`${n(7)}-${n(9)}`, `${n(2)}-${n(9)}`, `${n(9)}-${n(16)}`, `${n(7)}-${n(12)}`, `${n(2)}-${n(7)}`, `${n(8)}-${n(9)}`, `${n(5)}-${n(9)}`, `${n(2)}-${n(16)}`]
    : kind === "umatan"
      ? [`${n(9)}→${n(7)}`, `${n(7)}→${n(9)}`, `${n(9)}→${n(2)}`, `${n(2)}→${n(9)}`, `${n(9)}→${n(16)}`, `${n(7)}→${n(2)}`, `${n(2)}→${n(7)}`, `${n(12)}→${n(9)}`]
      : kind === "sanrenpuku"
        ? [`${n(2)}-${n(7)}-${n(9)}`, `${n(7)}-${n(9)}-${n(16)}`, `${n(2)}-${n(9)}-${n(16)}`, `${n(7)}-${n(9)}-${n(12)}`, `${n(2)}-${n(7)}-${n(16)}`, `${n(2)}-${n(8)}-${n(9)}`, `${n(5)}-${n(7)}-${n(9)}`, `${n(9)}-${n(12)}-${n(16)}`]
        : [`${n(9)}→${n(7)}→${n(2)}`, `${n(9)}→${n(2)}→${n(7)}`, `${n(7)}→${n(9)}→${n(2)}`, `${n(2)}→${n(9)}→${n(7)}`, `${n(7)}→${n(2)}→${n(9)}`, `${n(2)}→${n(7)}→${n(9)}`, `${n(9)}→${n(7)}→${n(16)}`, `${n(9)}→${n(16)}→${n(7)}`];
  const odds = kind === "umaren"
    ? [22.4, 25.1, 28.7, 31.4, 34.8, 38.2, 41.6, 46]
    : kind === "umatan"
      ? [48.7, 51.2, 53.8, 57.4, 61.9, 65.3, 68.5, 72.1]
      : kind === "sanrenpuku"
        ? [97.3, 108.6, 116.2, 126.4, 134.9, 142.1, 154.7, 169.8]
        : [400.1, 401.8, 403.1, 406.4, 408.4, 410.2, 447.8, 463.7];
  const rows = selections.map((selection, i) => {
    const shown = mode === "real" && i >= 3 ? "—" : `${odds[i]!.toFixed(1)}倍`;
    const note = mode === "real" && i < 3 ? "実票" : "";
    return `<div class="odds-preview-row"><span>${escapeHtml(selection)}${note ? `<small>${note}</small>` : ""}</span><b>${shown}</b></div>`;
  }).join("");
  return `<section class="odds-preview-panel"><div class="odds-preview-panel-head"><b>${escapeHtml(title)}</b><span>${mode === "real" ? "実票あり" : "人気上位 8組"}</span></div>${rows}</section>`;
}

function previewMarketPanelHtml(
  board: Board,
  kind: Exclude<BetKind, "win">,
  title: string,
  mode: "popular" | "real" = "popular",
): string {
  const nums = board.horses.filter((h) => !h.horse.scratched).map((h) => h.number);
  const perColumn = Math.ceil(nums.length / 2);
  const count = perColumn * 2;
  const ranked = [...nums.slice(6), ...nums.slice(0, 6)];
  const selections: string[] = [];
  for (let a = 0; a < ranked.length && selections.length < count; a += 1) {
    for (let b = 0; b < ranked.length && selections.length < count; b += 1) {
      if (a === b || ((kind === "umaren" || kind === "sanrenpuku") && a > b)) continue;
      if (kind === "umaren" || kind === "umatan") {
        selections.push(`${ranked[a]}${kind === "umatan" ? "→" : "－"}${ranked[b]}`);
        continue;
      }
      for (let c = 0; c < ranked.length && selections.length < count; c += 1) {
        if (a === c || b === c || (kind === "sanrenpuku" && (a > b || b > c))) continue;
        const separator = kind === "sanrentan" ? "→" : "－";
        selections.push(`${ranked[a]}${separator}${ranked[b]}${separator}${ranked[c]}`);
      }
    }
  }
  const baseOdds = { umaren: 22.4, umatan: 48.7, sanrenpuku: 97.3, sanrentan: 400.1 }[kind];
  const row = (selection: string, i: number) => {
    const shown = mode === "real" && i >= 3
      ? "－"
      : `${(baseOdds * (1 + i * 0.12)).toFixed(1)}倍`;
    const note = mode === "real" ? (i < 3 ? "実票" : "") : (i < 4 ? "人気" : "");
    return `<div class="odds-preview-row"><em>${i + 1}</em><span>${escapeHtml(selection)}${note ? `<small>${note}</small>` : ""}</span><span class="odds-preview-odds">${shown}</span></div>`;
  };
  const columns = [0, 1].map((column) => `<div class="odds-preview-column">${selections
    .slice(column * perColumn, (column + 1) * perColumn)
    .map((selection, i) => row(selection, column * perColumn + i))
    .join("")}</div>`).join("");
  return `<section class="odds-preview-panel"><div class="odds-preview-panel-head"><b>${escapeHtml(title)}</b><span>${mode === "real" ? "実票あり" : `人気上位 ${count}組`}</span></div><div class="odds-preview-columns">${columns}</div></section>`;
}

function previewMatrixOdds(kind: "umaren" | "sanrenpuku", a: number, b: number, c?: number): string {
  const spread = kind === "umaren" ? 14 : 62;
  const value = spread * (1 + (a + b + (c ?? 0)) * 0.11 + Math.abs(a - b) * 0.035);
  return value >= 9999.9 ? "9999.9+" : value.toFixed(1);
}

function legacyPreviewOddsMatrixHtml(board: Board, kind: "umaren" | "sanrenpuku"): string {
  const nums = board.horses.filter((h) => !h.horse.scratched).map((h) => h.number);
  const defaultAxis = nums[0] ?? 1;
  const headers = nums.map((num) => `<span class="odds-matrix-head">${num}</span>`).join("");
  const cells = nums.flatMap((row) => [
    `<span class="odds-matrix-head">${row}</span>`,
    ...nums.map((column) => {
      const valid = row < column && (kind === "umaren" || (row !== defaultAxis && column !== defaultAxis));
      const odds = valid ? previewMatrixOdds(kind, defaultAxis, row, column) : "";
      return `<span class="odds-matrix-cell${valid ? "" : " is-blank"}"${kind === "sanrenpuku" ? ` data-matrix-left="${row}" data-matrix-top="${column}"` : ""}>${odds}</span>`;
    }),
  ]).join("");
  const selector = kind === "sanrenpuku"
    ? `<label class="odds-matrix-select">軸ウマ娘 <select id="sanrenpuku-axis">${nums.map((num) => `<option value="${num}"${num === defaultAxis ? " selected" : ""}>${num}番</option>`).join("")}</select></label>`
    : "";
  const title = kind === "umaren" ? "馬連" : "3連複";
  const description = kind === "umaren" ? "組み合わせ別・参考オッズ" : "軸ウマ娘を含む組み合わせ・参考オッズ";
  return `<section class="odds-matrix-panel"><div class="odds-preview-panel-head"><b>${title}</b><span>${description}</span>${selector}</div><div class="odds-matrix" style="--matrix-count:${nums.length}" data-matrix-kind="${kind}" data-matrix-axis="${defaultAxis}"><span class="odds-matrix-corner"></span>${headers}${cells}</div></section>`;
}

function legacyPreviewPackedMatrixGridHtml(
  columns: readonly number[],
  rows: readonly number[],
  kind: "umaren" | "sanrenpuku",
  axis: number,
  className: string,
): string {
  const headers = columns.map((num) => `<span class="odds-matrix-head">${num}</span>`).join("");
  const cells = rows.flatMap((second) => [
    `<span class="odds-matrix-head">${second}</span>`,
    ...columns.map((first) => {
      const valid = first < second && (kind === "umaren" || (first !== axis && second !== axis));
      const odds = valid ? previewMatrixOdds(kind, axis, first, second) : "";
      return `<span class="odds-matrix-cell${valid ? "" : " is-blank"}"${kind === "sanrenpuku" ? ` data-matrix-left="${first}" data-matrix-top="${second}"` : ""}>${odds}</span>`;
    }),
  ]).join("");
  return `<div class="odds-matrix ${className}" style="--matrix-count:${columns.length}" data-matrix-kind="${kind}" data-matrix-axis="${axis}"><span class="odds-matrix-corner"></span>${headers}${cells}</div>`;
}

function previewPackedMatrixGridHtml(
  columns: readonly number[],
  runners: readonly number[],
  kind: "umaren" | "sanrenpuku",
  axis: number,
  className: string,
  gridColumnCount = columns.length,
  firstColumnStart?: number,
  leadingHtml = "",
  liveItems?: readonly VenueOddsItem[],
): string {
  const runnerCount = runners.length;
  const axisColumn = (first: number) => {
    const waku = wakuOf(first, runnerCount);
    const entries = runners
      .filter((second) => first < second)
      .map((second) => {
        const valid = kind === "umaren" || (first !== axis && second !== axis);
        const label = kind === "umaren"
          ? `${first}-${second}`
          : [axis, first, second].sort((a, b) => a - b).join("-");
        const liveItem = liveItems?.find((item) => item.label === label);
        const odds = valid
          ? (liveItems ? venueOddsText(liveItem?.odds ?? null) : previewMatrixOdds(kind, axis, first, second))
          : "";
        return `<div class="odds-matrix-entry${valid ? "" : " is-blank"}" data-odds-label="${label}"${kind === "sanrenpuku" ? ` data-matrix-left="${first}" data-matrix-top="${second}"` : ""}><em>${second}</em><b>${odds}</b></div>`;
      }).join("");
    const hidden = kind === "sanrenpuku" && first === axis ? " is-blank" : "";
    const gridColumn = firstColumnStart !== undefined && first === columns[0] ? ` style="grid-column-start:${firstColumnStart}"` : "";
    return `<section class="odds-matrix-column${hidden}"${kind === "sanrenpuku" ? ` data-matrix-axis-column="${first}"` : ""}${gridColumn}><div class="odds-matrix-axis"><i class="waku-marker w${waku}"></i><b>${first}</b><i class="waku-marker w${waku}"></i></div>${entries}</section>`;
  };
  const kindClass = kind === "sanrenpuku" ? " odds-matrix--sanrenpuku" : "";
  return `<div class="odds-matrix ${className}${kindClass}" style="--matrix-count:${gridColumnCount}" data-matrix-kind="${kind}" data-matrix-axis="${axis}">${leadingHtml}${columns.map(axisColumn).join("")}</div>`;
}

function previewOddsMatrixHtml(
  board: Board,
  kind: "umaren" | "sanrenpuku",
  previewRunnerCount?: number,
  liveResponse?: Extract<VenueOddsResponse, { view: "umaren" | "sanrenpuku" }>,
): string {
  const boardNums = board.horses.filter((h) => !h.horse.scratched).map((h) => h.number);
  const nums = previewRunnerCount
    ? Array.from({ length: previewRunnerCount }, (_, i) => i + 1)
    : boardNums;
  const axis = nums[0] ?? 1;
  // 最終馬番は以降の相手がいないため軸列にしない。2人減るごとに主表を1列減らす。
  const axisNums = nums.slice(0, -1);
  const primaryCount = kind === "sanrenpuku"
    ? Math.min(axisNums.length, Math.floor(nums.length / 2) + 2)
    : Math.min(axisNums.length, Math.ceil(nums.length / 2) + 1);
  const primary = axisNums.slice(0, primaryCount);
  const folded = axisNums.slice(primaryCount);
  const runnerName = (num: number) => board.horses.find((entry) => entry.number === num)?.horse.uma_name ?? `ウマ娘${num}`;
  const axisPanel = kind === "sanrenpuku"
    ? `<aside class="odds-matrix-axis-panel"><span class="odds-matrix-axis-title">軸ウマ娘</span><button type="button" class="odds-matrix-axis-button" id="sanrenpuku-axis-open" aria-haspopup="dialog" aria-controls="sanrenpuku-axis-modal"><span class="odds-matrix-axis-number">${axis}番</span><span class="odds-matrix-axis-name">${escapeHtml(runnerName(axis))}</span></button></aside>`
    : "";
  const title = kind === "umaren" ? "馬連" : "3連複";
  const description = kind === "umaren" ? "組み合わせ別・参考オッズ" : "軸ウマ娘を含む組み合わせ・参考オッズ";
  const main = previewPackedMatrixGridHtml(primary, nums, kind, axis, "odds-matrix--main", primary.length, undefined, axisPanel, liveResponse?.items);
  const foldedStart = primary.length - folded.length + 1;
  const secondary = folded.length > 1
    ? previewPackedMatrixGridHtml([...folded].reverse(), nums, kind, axis, "odds-matrix--folded", primary.length, foldedStart, "", liveResponse?.items)
    : "";
  const body = liveResponse && !liveResponse.enabled
    ? unavailableOddsHtml()
    : `<div class="odds-matrix-layout" style="--primary-count:${primary.length};--folded-count:${folded.length}">${main}${secondary}</div>`;
  return `<section class="odds-matrix-panel"><div class="odds-preview-panel-head"><b>${title}</b><span>${description}</span></div>${body}</section>`;
}

function venueOddsText(odds: number | null): string {
  if (odds == null || !Number.isFinite(odds)) return "—";
  return odds >= 9999.9 ? "9999.9+" : odds.toFixed(1);
}

function unavailableOddsHtml(): string {
  return `<div class="odds-market-unavailable">この開催では取り扱いなし</div>`;
}

function sanrenpukuAxisModalHtml(board: Board, previewRunnerCount?: number): string {
  const nums = previewRunnerCount
    ? Array.from({ length: previewRunnerCount }, (_, i) => i + 1)
    : board.horses.filter((entry) => !entry.horse.scratched).map((entry) => entry.number);
  const nameOf = (num: number) => board.horses.find((entry) => entry.number === num)?.horse.uma_name ?? `ウマ娘${num}`;
  const choices = nums.map((num) => {
    const waku = wakuOf(num, nums.length);
    return `<button type="button" class="odds-axis-choice" data-axis-choice="${num}"><i class="waku-marker w${waku}"></i><b>${num}番</b><span class="odds-axis-choice-name">${escapeHtml(nameOf(num))}</span></button>`;
  }).join("");
  return `<dialog class="odds-axis-modal" id="sanrenpuku-axis-modal" aria-labelledby="sanrenpuku-axis-modal-title"><header><div><h2 id="sanrenpuku-axis-modal-title">軸ウマ娘を選ぶ</h2><p>選んだウマ娘を含む3連複の組み合わせを表示します。</p></div><button type="button" class="odds-axis-modal-close" id="sanrenpuku-axis-close">閉じる</button></header><select id="sanrenpuku-axis" hidden aria-hidden="true">${nums.map((num) => `<option value="${num}">${num}番</option>`).join("")}</select><div class="odds-axis-choice-grid">${choices}</div></dialog>`;
}

function previewOrderedColumnHtml(
  board: Board,
  kind: "umatan" | "sanrentan",
  title: string,
  mode: "popular" | "real",
  liveMarket?: VenueOrderedMarket,
): string {
  const nums = board.horses.filter((entry) => !entry.horse.scratched).map((entry) => entry.number);
  const ranked = [...nums.slice(6), ...nums.slice(0, 6)];
  const selections: string[] = [];
  for (let a = 0; a < ranked.length && selections.length < 9; a += 1) {
    for (let b = 0; b < ranked.length && selections.length < 9; b += 1) {
      if (a === b) continue;
      if (kind === "umatan") {
        selections.push(`${ranked[a]}→${ranked[b]}`);
        continue;
      }
      for (let c = 0; c < ranked.length && selections.length < 9; c += 1) {
        if (a === c || b === c) continue;
        selections.push(`${ranked[a]}→${ranked[b]}→${ranked[c]}`);
      }
    }
  }
  const baseOdds = kind === "umatan" ? 48.7 : 400.1;
  const liveItems = liveMarket ? (mode === "popular" ? liveMarket.popular : liveMarket.recent) : null;
  const isEmptyRecentVotes = liveItems ? mode === "real" && liveItems.length === 0 : kind === "sanrentan" && mode === "real";
  const rows = isEmptyRecentVotes ? `<div class="odds-ordered-empty">最初の投票を<br>お待ちしています</div>` : liveItems ? liveItems.map((item) => {
    return `<div class="odds-ordered-row" data-odds-key="${escapeHtml(item.key)}"><span>${escapeHtml(item.label)}</span><b>${venueOddsText(item.odds)}</b></div>`;
  }).join("") : selections.map((selection, index) => {
    const odds = baseOdds * (1 + index * 0.12);
    return `<div class="odds-ordered-row"><span>${selection}</span><b>${odds.toFixed(1)}</b></div>`;
  }).join("");
  return `<section class="odds-ordered-column" data-ordered-kind="${kind}" data-ordered-mode="${mode}"><h3>${title}</h3><div class="odds-ordered-rows">${rows}</div></section>`;
}

function previewOrderedHtml(board: Board, liveResponse?: Extract<VenueOddsResponse, { view: "ordered" }>): string {
  const group = (kind: "umatan" | "sanrentan", title: string) => {
    const market = liveResponse?.markets.find((item) => item.kind === kind);
    const body = market && !market.enabled
      ? unavailableOddsHtml()
      : previewOrderedColumnHtml(board, kind, "人気上位", "popular", market)
        + previewOrderedColumnHtml(board, kind, "直近投票", "real", market);
    return `<section class="odds-ordered-group" data-ordered-group="${kind}"><h2>${title}</h2>${body}</section>`;
  };
  return `<div class="odds-preview-ordered">${group("umatan", "馬単")}${group("sanrentan", "3連単")}</div>`;
}

function previewMarketHtml(board: Board, layout: VenueOddsPreviewLayout, previewRunnerCount?: number, live = false): string {
  const kinds: Array<Exclude<BetKind, "win">> = ["umaren", "umatan", "sanrenpuku", "sanrentan"];
  const view = (id: string, body: string, on = false) => `<div class="odds-preview-market" data-preview-view="${id}"${on ? "" : " hidden"}>${body}</div>`;
  if (layout === "jra") {
    const umaren = live ? venueOddsResponse(board, "umaren") as Extract<VenueOddsResponse, { view: "umaren" }> : undefined;
    const sanrenpuku = live ? venueOddsResponse(board, "sanrenpuku", 1) as Extract<VenueOddsResponse, { view: "sanrenpuku" }> : undefined;
    const ordered = live ? venueOddsResponse(board, "ordered") as Extract<VenueOddsResponse, { view: "ordered" }> : undefined;
    return view("umaren", previewOddsMatrixHtml(board, "umaren", previewRunnerCount, umaren))
      + view("sanrenpuku", previewOddsMatrixHtml(board, "sanrenpuku", previewRunnerCount, sanrenpuku))
      + view("ordered", previewOrderedHtml(board, ordered))
      + sanrenpukuAxisModalHtml(board, previewRunnerCount);
  }
  if (layout === "three") {
    return view("pair", previewMarketPanelHtml(board, "umaren", "馬連") + previewMarketPanelHtml(board, "umatan", "馬単"))
      + view("triple", previewMarketPanelHtml(board, "sanrenpuku", "3連複") + previewMarketPanelHtml(board, "sanrentan", "3連単"));
  }
  return kinds.map((kind) => view(kind,
    previewMarketPanelHtml(board, kind, `${BET_KIND_LABEL[kind]}・人気上位`)
      + previewMarketPanelHtml(board, kind, `${BET_KIND_LABEL[kind]}・実票あり`, "real"),
  )).join("");
}

function previewTabsHtml(layout: VenueOddsPreviewLayout): string {
  const tabs = layout === "jra"
    ? [["win", "単勝"], ["umaren", "馬連"], ["sanrenpuku", "3連複"], ["ordered", "馬単・3連単"]]
    : layout === "three"
    ? [["win", "単勝"], ["pair", "2人組"], ["triple", "3人組"]]
    : [["win", "単勝"], ["umaren", "馬連"], ["umatan", "馬単"], ["sanrenpuku", "3連複"], ["sanrentan", "3連単"]];
  return `<div class="odds-preview-switcher"><span class="odds-preview-switcher-label">表示切替</span><div class="odds-preview-tabs" role="tablist" aria-label="参考オッズの種別">${tabs.map(([id, label], i) => `<button type="button" role="tab" data-preview-tab="${id}" aria-selected="${i === 0 ? "true" : "false"}">${label}</button>`).join("")}</div></div>`;
}

function previewTabsScript(apiPath?: string): string {
  return `<script>
(() => {
  const root = document.querySelector(".odds-preview");
  if (!root) return;
  const apiPath = ${JSON.stringify(apiPath ?? null)};
  const tabs = [...root.querySelectorAll("[data-preview-tab]")];
  const views = [...root.querySelectorAll("[data-preview-view]")];
  const winView = root.querySelector('[data-preview-view="win"]');
  const syncPreviewHeight = () => {
    if (!(winView instanceof HTMLElement)) return;
    root.style.removeProperty("--odds-preview-body-height");
    const wasHidden = winView.hidden;
    const originalStyle = winView.getAttribute("style");
    if (wasHidden) {
      winView.hidden = false;
      winView.style.position = "absolute";
      winView.style.visibility = "hidden";
      winView.style.pointerEvents = "none";
      winView.style.width = root.clientWidth + "px";
    }
    const height = Math.ceil(winView.getBoundingClientRect().height);
    if (wasHidden) {
      winView.hidden = true;
      if (originalStyle == null) winView.removeAttribute("style");
      else winView.setAttribute("style", originalStyle);
    }
    if (height > 0) root.style.setProperty("--odds-preview-body-height", height + "px");
  };
  syncPreviewHeight();
  window.addEventListener("resize", syncPreviewHeight);
  document.fonts?.ready.then(syncPreviewHeight);
  for (const tab of tabs) tab.addEventListener("click", () => {
    const target = tab.dataset.previewTab;
    for (const item of tabs) item.setAttribute("aria-selected", String(item === tab));
    for (const view of views) view.toggleAttribute("hidden", view.dataset.previewView !== target);
    void refresh(target);
  });
  const axis = root.querySelector("#sanrenpuku-axis");
  const axisOpen = root.querySelector("#sanrenpuku-axis-open");
  const axisModal = root.querySelector("#sanrenpuku-axis-modal");
  const axisClose = root.querySelector("#sanrenpuku-axis-close");
  const matrices = [...root.querySelectorAll('[data-matrix-kind="sanrenpuku"]')];
  const updateSanrenpuku = () => {
    if (!(axis instanceof HTMLSelectElement) || matrices.length === 0) return;
    const first = Number(axis.value);
    const axisNumber = root.querySelector(".odds-matrix-axis-number");
    const axisName = root.querySelector(".odds-matrix-axis-name");
    const selectedChoice = [...root.querySelectorAll("[data-axis-choice]")].find((choice) => choice.dataset.axisChoice === axis.value);
    if (axisNumber) axisNumber.textContent = axis.value + "番";
    if (axisName && selectedChoice) axisName.textContent = selectedChoice.querySelector(".odds-axis-choice-name")?.textContent ?? "";
    for (const choice of root.querySelectorAll("[data-axis-choice]")) {
      choice.classList.toggle("is-selected", choice === selectedChoice);
      choice.setAttribute("aria-pressed", String(choice === selectedChoice));
    }
    for (const matrix of matrices) {
      matrix.dataset.matrixAxis = axis.value;
      for (const column of matrix.querySelectorAll("[data-matrix-axis-column]")) {
        column.classList.toggle("is-blank", Number(column.dataset.matrixAxisColumn) === first);
      }
      for (const cell of matrix.querySelectorAll("[data-matrix-left]")) {
        const left = Number(cell.dataset.matrixLeft);
        const top = Number(cell.dataset.matrixTop);
        const valid = left < top && left !== first && top !== first;
        const odds = cell.querySelector("b");
        cell.dataset.oddsLabel = [first, left, top].sort((a, b) => a - b).join("-");
        cell.classList.toggle("is-blank", !valid);
        if (!valid) { if (odds) odds.textContent = ""; continue; }
        if (!apiPath) {
          const value = 62 * (1 + (first + left + top) * 0.11 + Math.abs(left - top) * 0.035);
          if (odds) odds.textContent = value >= 9999.9 ? "9999.9+" : value.toFixed(1);
        }
      }
    }
    const primary = root.querySelector('.odds-matrix--main[data-matrix-kind="sanrenpuku"]');
    const folded = root.querySelector('.odds-matrix--folded[data-matrix-kind="sanrenpuku"]');
    if (!(primary instanceof HTMLElement)) return;
    const primaryColumns = [...primary.querySelectorAll("[data-matrix-axis-column]")];
    const axisIsInPrimary = primaryColumns.some((column) => Number(column.dataset.matrixAxisColumn) === first);
    const gridCount = primaryColumns.length + (axisIsInPrimary ? 0 : 1);
    primary.style.setProperty("--matrix-count", String(gridCount));
    for (const column of primaryColumns) {
      if (column instanceof HTMLElement) column.style.removeProperty("grid-column-start");
    }
    const firstPrimary = primaryColumns.find((column) => Number(column.dataset.matrixAxisColumn) !== first);
    if (firstPrimary instanceof HTMLElement) firstPrimary.style.gridColumnStart = "2";
    if (folded instanceof HTMLElement) {
      folded.style.setProperty("--matrix-count", String(gridCount));
      const foldedColumns = [...folded.querySelectorAll("[data-matrix-axis-column]")];
      for (const column of foldedColumns) {
        if (column instanceof HTMLElement) column.style.removeProperty("grid-column-start");
      }
      const visibleFolded = foldedColumns.filter((column) => Number(column.dataset.matrixAxisColumn) !== first);
      const firstFolded = visibleFolded.find((column) => column instanceof HTMLElement);
      if (firstFolded instanceof HTMLElement) {
        firstFolded.style.gridColumnStart = String(gridCount - visibleFolded.length + 1);
      }
    }
  };
  updateSanrenpuku();
  axis?.addEventListener("change", () => {
    updateSanrenpuku();
    void refresh("sanrenpuku");
  });
  axisOpen?.addEventListener("click", () => {
    if (axisModal instanceof HTMLDialogElement) axisModal.showModal();
  });
  axisClose?.addEventListener("click", () => {
    if (axisModal instanceof HTMLDialogElement) axisModal.close();
  });
  axisModal?.addEventListener("click", (event) => {
    if (event.target === axisModal && axisModal instanceof HTMLDialogElement) axisModal.close();
  });
  for (const choice of root.querySelectorAll("[data-axis-choice]")) choice.addEventListener("click", () => {
    if (!(axis instanceof HTMLSelectElement)) return;
    axis.value = choice.dataset.axisChoice ?? axis.value;
    axis.dispatchEvent(new Event("change"));
    if (axisModal instanceof HTMLDialogElement) axisModal.close();
  });
  const shownOdds = (odds) => odds == null || !Number.isFinite(odds)
    ? "—"
    : Number(odds) >= 9999.9 ? "9999.9+" : Number(odds).toFixed(1);
  const renderOrderedColumn = (market, mode) => {
    const column = root.querySelector('[data-ordered-kind="' + market.kind + '"][data-ordered-mode="' + mode + '"] .odds-ordered-rows');
    if (!column) return;
    const items = mode === "popular" ? market.popular : market.recent;
    column.replaceChildren();
    if (mode === "real" && items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "odds-ordered-empty";
      empty.append("最初の投票を", document.createElement("br"), "お待ちしています");
      column.append(empty);
      return;
    }
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "odds-ordered-row";
      row.dataset.oddsKey = item.key;
      const label = document.createElement("span");
      label.textContent = item.label;
      const odds = document.createElement("b");
      odds.textContent = shownOdds(item.odds);
      row.append(label, odds);
      column.append(row);
    }
  };
  const applyVenue = (venue) => {
    if (!venue) return;
    if (venue.view === "win") {
      const items = new Map(venue.items.map((item) => [item.key, item.odds]));
      for (const row of root.querySelectorAll('.sheet-row[data-sel]')) {
        const cell = row.querySelector(".odds-now");
        if (cell) cell.textContent = shownOdds(items.get(row.dataset.sel));
      }
      return;
    }
    if (venue.view === "umaren" || venue.view === "sanrenpuku") {
      const view = root.querySelector('[data-preview-view="' + venue.view + '"]');
      if (!view || !venue.enabled) return;
      const items = new Map(venue.items.map((item) => [item.label, item.odds]));
      for (const cell of view.querySelectorAll("[data-odds-label]")) {
        const odds = cell.querySelector("b");
        if (odds && !cell.classList.contains("is-blank")) odds.textContent = shownOdds(items.get(cell.dataset.oddsLabel));
      }
      return;
    }
    for (const market of venue.markets) {
      if (!market.enabled) continue;
      renderOrderedColumn(market, "popular");
      renderOrderedColumn(market, "real");
    }
  };
  let refreshing = false;
  const refresh = async (view) => {
    if (!apiPath || refreshing || !["win", "umaren", "sanrenpuku", "ordered"].includes(view)) return;
    refreshing = true;
    try {
      const params = new URLSearchParams({ venue_view: view });
      if (view === "sanrenpuku" && axis instanceof HTMLSelectElement) params.set("axis", axis.value);
      const response = await fetch(apiPath + "?" + params, { headers: { accept: "application/json" } });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.status && payload.status !== document.body.dataset.phase) {
        location.reload();
        return;
      }
      applyVenue(payload.venue);
      if (payload.status !== "setup" && payload.status !== "voting" && timer != null) {
        clearInterval(timer);
        timer = null;
      }
    } catch { /* 次の5秒更新で再試行する */ }
    finally { refreshing = false; }
  };
  const activeView = () => tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.previewTab ?? "win";
  let timer = apiPath && (document.body.dataset.phase === "setup" || document.body.dataset.phase === "voting")
    ? setInterval(() => { if (!document.hidden) void refresh(activeView()); }, 5000)
    : null;
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void refresh(activeView());
  });
})();
</script>`;
}

function venueChromeScript(published: boolean): string {
  return `<script>
(() => {
  const scene = document.querySelector(".scene");
  const q = new URLSearchParams(location.search).get("slot");
  const preferenceKey = "oshi-keiba:background";
  function jstHour() {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo", hour: "numeric", hour12: false,
    }).formatToParts(new Date());
    return Number(p.find((x) => x.type === "hour").value);
  }
  function fromClock() {
    const h = jstHour();
    if (h >= 6 && h < 16) return "day";
    if (h >= 16 && h < 19) return "dusk";
    return "night";
  }
  function applySlot() {
    if (!scene) return;
    const preference = globalThis.localStorage?.getItem(preferenceKey);
    if (q === "day" || q === "dusk" || q === "night") scene.dataset.slot = q;
    else if (preference === "day" || preference === "night") scene.dataset.slot = preference;
    else scene.dataset.slot = fromClock();
  }
  applySlot();
  const clock = document.getElementById("now-clock");
  const tick = () => {
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(new Date());
    }
    applySlot();
  };
  tick();
  setInterval(tick, 10000);

  const a = document.getElementById("rows-a");
  const b = document.getElementById("rows-b");
  const mq = window.matchMedia("(min-width: 900px)");
  function splitSheet() {
    if (!a || !b) return;
    const rows = [...a.children, ...b.children];
    a.replaceChildren();
    b.replaceChildren();
    if (!mq.matches || rows.length <= 1) {
      for (const r of rows) a.appendChild(r);
      return;
    }
    const mid = Math.ceil(rows.length / 2);
    rows.forEach((r, i) => (i < mid ? a : b).appendChild(r));
  }
  splitSheet();
  mq.addEventListener("change", splitSheet);

  ${
    published
      ? `function setResult(v) {
    if (!scene) return;
    const view = v === "field" ? "field" : "show";
    scene.dataset.result = view;
    for (const btn of document.querySelectorAll(".result-tabs [data-result]")) {
      btn.setAttribute("aria-pressed", btn.dataset.result === view ? "true" : "false");
    }
  }
  const rq = new URLSearchParams(location.search).get("result");
  setResult(rq === "field" ? "field" : "show");
  for (const btn of document.querySelectorAll(".result-tabs [data-result]")) {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      setResult(btn.dataset.result);
    });
  }
  document.getElementById("jumbo")?.addEventListener("click", () => setResult("field"));
  const boardEl = document.querySelector("section.board");
  let swipeX = null;
  boardEl?.addEventListener("pointerdown", (e) => { swipeX = e.clientX; });
  boardEl?.addEventListener("pointerup", (e) => {
    if (swipeX == null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (dx < -48) setResult("field");
    if (dx > 48) setResult("show");
  });`
      : ""
  }
})();
</script>`;
}

export function venueBoardPage(opts: {
  board: Board;
  user: UserRow | null;
  flash: { text: string | null; error: boolean };
  slot: VenueSlot;
  scripts?: string;
  /** published の自分の馬券。未ログインや無しは呼び出し側で空相当を渡す */
  ticketsHtml?: string;
  strategicSkills?: readonly StrategicSkillRow[];
  showUmabashira?: boolean;
  /** ローカル限定の表示試作。通常の場内には指定しない。 */
  oddsPreview?: VenueOddsPreviewLayout;
  /** ローカル試作でのみ使う、連勝表の表示頭数。 */
  oddsPreviewRunnerCount?: number;
}): string {
  const status = opts.board.event.status;
  const isSetup = status === "setup";
  const closed = status === "closed";
  const published = status === "published";
  const who = opts.user
    ? `${escapeHtml(opts.user.display_name)} · ${formatPt(opts.user.balance)}`
    : "";
  const logout = opts.user ? `<a href="/logout">ログアウト</a>` : "";
  const ctaHref = opts.user ? "/bet" : "/login";
  const closeHm = venueCloseHm(opts.board.event.voting_closes_at);
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const rows = venueWinSheetRows(opts.board);
  const pillClass = published
    ? "pill idle done"
    : closed || isSetup
      ? "pill idle"
      : "pill";
  const phaseLabel = published
    ? "結果公開"
    : closed
      ? "投票締切"
      : isSetup
        ? "出走登録中"
        : "投票中";
  const phaseAttr = published
    ? "published"
    : closed
      ? "closed"
      : isSetup
        ? "setup"
        : "voting";
  const metaNow =
    closed || published
      ? ""
      : `<span id="meta-now">現在 <strong id="now-clock"></strong></span>`;
  const metaClose = published
    ? `<span id="meta-close">払戻済み</span>`
    : closed
      ? `<span id="meta-close">確定配当</span>`
      : isSetup
        ? `<span id="meta-close">投票開始前</span>`
        : `<span id="meta-close">締切 <strong>${escapeHtml(closeHm)}</strong></span>`;
  const resultTabs = published
    ? `<div class="result-tabs" role="tablist" aria-label="結果の見方">
        <button type="button" data-result="show" aria-pressed="true">結果の盤</button>
        <button type="button" data-result="field" aria-pressed="false">全頭</button>
      </div>`
    : "";
  const jumbo = published
    ? `<div class="jumbo" id="jumbo">
        ${venuePayBoardHtml(opts.board)}
        ${venueFinishBoardHtml(opts.board)}
      </div>
      <p class="jumbo-hint" id="jumbo-hint"><span class="jh-wide">左が払戻、右が確定盤。</span><span class="jh-narrow">上が払戻、下が確定盤。</span>スワイプまたはタップで全頭</p>`
    : "";
  const tickets = published
    ? (opts.ticketsHtml ??
      `<div class="tickets" id="tickets"><div class="tickets-h">自分の馬券</div><div class="t-row"><span class="lab">なし</span><span class="yen"></span><span class="res"></span></div></div>`)
    : "";
  const foot = venueFootHtml({
    status,
    ctaHref,
    closedHint: venueClosedHint(opts.board),
    publishedHint: venuePublishedHint(opts.board),
    showUmabashira: opts.showUmabashira,
  });
  const umabashira = opts.showUmabashira
    ? memberUmabashiraModalHtml(opts.board, opts.strategicSkills)
    : "";
  const head = sheetHeadHtml(published);
  const preview = opts.oddsPreview && !published ? opts.oddsPreview : null;
  const oddsLayout: VenueOddsPreviewLayout | null = preview ?? (!published ? "jra" : null);
  const liveOdds = oddsLayout != null && preview == null;
  const previewRunnerControls = preview === "jra" && opts.oddsPreviewRunnerCount
    ? `<nav class="odds-preview-runner-controls" aria-label="連勝表の表示頭数"><span>表示頭数</span>${[15, 16, 17, 18].map((count) => `<a href="/__local/venue-odds?runners=${count}"${count === opts.oddsPreviewRunnerCount ? ' aria-current="page"' : ""}>${count}人</a>`).join("")}</nav>`
    : "";
  const boardTitle = (() => {
    const headParts = venueBoardHeadParts(opts.board);
    return `<h1><span class="board-head-title">${escapeHtml(headParts[0] ?? "")}</span>${headParts.length > 1 ? `<span class="board-head-detail">${escapeHtml(headParts.slice(1).join("　"))}</span>` : ""}</h1>`;
  })();
  const winColumns = `<div class="cols" data-preview-view="win">
          <div class="sheet-wrap">
            <div class="sheet" role="table" aria-label="単勝オッズ">
              ${head}
              <div id="rows-a">${rows}</div>
            </div>
          </div>
          <div class="sheet-wrap col-b">
            <div class="sheet" role="table" aria-label="単勝オッズ 続き">
              ${head}
              <div id="rows-b"></div>
            </div>
          </div>
        </div>`;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>場内</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
  <style>${VENUE_CSS}</style>
</head>
<body data-phase="${phaseAttr}">
  <div class="scene member-glass member-glass--venue" data-slot="${opts.slot}" data-phase="${phaseAttr}"${published ? ' data-result="show"' : ""}>
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      <header class="chrome member-chrome venue-chrome">
        <div class="chrome-brand">
          <a class="brand" href="/">OSHI KEIBA</a>
          <div class="who" id="who-line">${who}</div>
        </div>
        <div class="chrome-state led-meta">
          <span class="${pillClass}" id="phase-pill"><span class="dot"></span><span id="phase-label">${phaseLabel}</span></span>
          ${chromeTimesHtml(metaNow, metaClose)}
        </div>
        <nav class="chrome-nav site-nav" aria-label="ページ移動">
          <a class="on" href="/">場内</a>
          <a href="/bet">窓口</a>
          <a href="/paddock">パドック</a>
        </nav>
        <div class="chrome-menu">
          <button type="button" class="more-btn" id="more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button>
          <div class="more-pop" id="more-pop">
            <a href="#" id="howto-open">使い方</a>
            <button type="button" id="background-open">背景</button>
            ${logout}
            <a href="/admin">管理者</a>
          </div>
        </div>
      </header>
      <section class="board${oddsLayout ? " odds-preview" : ""}">
        ${flash}
        <div class="board-head">
          ${boardTitle}
          ${resultTabs}
        </div>
        ${oddsLayout ? previewTabsHtml(oddsLayout) : ""}
        ${jumbo}
        ${winColumns}
        ${oddsLayout ? previewMarketHtml(opts.board, oddsLayout, opts.oddsPreviewRunnerCount, liveOdds) : ""}
        ${tickets}
        ${foot}
      </section>
    </div>
    ${previewRunnerControls}
  </div>
  ${memberOutLinks()}
  ${howToModal()}
  ${backgroundModal()}
  ${umabashira}
  ${memberMoreScript()}
  ${venueChromeScript(published)}
  ${oddsLayout ? previewTabsScript(liveOdds ? "/api/board" : undefined) : ""}
  ${opts.showUmabashira ? memberUmabashiraScript() : ""}
  ${opts.scripts ?? ""}
</body>
</html>`;
}
