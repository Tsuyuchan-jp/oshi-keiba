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
  venueHorseRowHtml,
  venuePayKindClass,
  venuePlaceRoman,
  venueStyleLabel,
  type VenueSlot,
} from "./venueBoard.ts";
import { VENUE_CSS } from "./venueCss.ts";
import { memberMoreScript, memberOutLinks } from "./memberShell.ts";

export type { VenueSlot };
export { resolveVenueSlot } from "./venueBoard.ts";

export function venueCloseHm(ms: number | null): string {
  const t = toJstInput(ms);
  return t ? t.slice(11, 16) : "—";
}

/** 盤見出し。評価点の記号は出さない。芝・稍重は開催条件の見た目 */
export function venueBoardHead(board: Board): string {
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
  return bits.join("　");
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
      const roman = venuePlaceRoman(place);
      return `<div class="fin-row"><span class="fin-rk">${roman}</span><span class="fin-n">${h.number}</span><span class="fin-place-lbl">${place}着</span></div>`;
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
    <span class="c-runner" role="columnheader">出走者</span>
    <span class="c-style" role="columnheader">脚質</span>
    <span class="c-odds" role="columnheader">オッズ</span>
    ${place}
  </div>`;
}

function venueChromeScript(published: boolean): string {
  return `<script>
(() => {
  const scene = document.querySelector(".scene");
  const q = new URLSearchParams(location.search).get("slot");
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
    if (q === "day" || q === "dusk" || q === "night") scene.dataset.slot = q;
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
      <p class="jumbo-hint" id="jumbo-hint">左が払戻、右が確定盤。スワイプまたはタップで全頭</p>`
    : "";
  const tickets = published
    ? (opts.ticketsHtml ??
      `<div class="tickets" id="tickets"><div class="tickets-h">自分の馬券</div><div class="t-row"><span class="lab">なし</span><span class="yen"></span><span class="res"></span></div></div>`)
    : "";
  const foot = published
    ? `<div class="foot"><span class="hint" id="phase-hint">${escapeHtml(venuePublishedHint(opts.board))}</span></div>`
    : closed
      ? `<div class="foot"><span class="hint" id="phase-hint">${escapeHtml(venueClosedHint(opts.board))}</span></div>`
      : isSetup
        ? `<div class="foot"><span class="hint" id="phase-hint">投票開始までお待ちください。</span></div>`
        : `<div class="foot"><div class="foot-actions"><a class="paddock-cta" href="/paddock">パドックを見る</a><a class="cta" href="${ctaHref}">馬券を買う</a></div></div>`;
  const head = sheetHeadHtml(published);
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
<body>
  <div class="scene" data-slot="${opts.slot}" data-phase="${phaseAttr}"${published ? ' data-result="show"' : ""}>
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      <header class="chrome venue-chrome">
        <div class="chrome-brand">
          <a class="brand" href="/">OSHI KEIBA</a>
          <div class="who" id="who-line">${who}</div>
        </div>
        <div class="chrome-state led-meta">
          <span class="${pillClass}" id="phase-pill"><span class="dot"></span><span id="phase-label">${phaseLabel}</span></span>
          ${metaNow}
          ${metaClose}
        </div>
        <nav class="chrome-nav site-nav" aria-label="ページ移動">
          <a class="on" href="/">場内</a>
          <a href="/paddock">パドック</a>
          <a href="/bet">窓口</a>
        </nav>
        <div class="chrome-menu">
          <button type="button" class="more-btn" id="more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button>
          <div class="more-pop" id="more-pop">
            <a href="#" id="howto-open">使い方</a>
            ${logout}
            <a href="/admin">管理者</a>
          </div>
        </div>
      </header>
      <section class="board">
        ${flash}
        <div class="board-head">
          <h1>${escapeHtml(venueBoardHead(opts.board))}</h1>
          ${resultTabs}
        </div>
        ${jumbo}
        <div class="cols">
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
        </div>
        ${tickets}
        ${foot}
      </section>
    </div>
  </div>
  ${memberOutLinks()}
  ${howToModal()}
  ${memberMoreScript()}
  ${venueChromeScript(published)}
  ${opts.scripts ?? ""}
</body>
</html>`;
}
