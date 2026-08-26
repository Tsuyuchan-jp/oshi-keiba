/**
 * 場内の投票中・締切面。HTML 構造・クラスはモック、name / 既存 id・挙動は本番。
 * 公開・窓口・入場はまだ和紙レイアウト。
 */
import { escapeHtml } from "./http.ts";
import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { horseSheetParts } from "./horseName.ts";
import {
  BET_KIND_LABEL,
  BET_KINDS,
  parseEnabledKinds,
} from "./bets.ts";
import { getScoreCourse, GROUND_CONDITION_OPTIONS } from "./scoreSetup.ts";
import { eventScoreSetup, type Board, type UserRow } from "./store.ts";
import {
  flashHtml,
  formatPt,
  howToModal,
  toJstInput,
} from "./ui.ts";
import {
  formatVenueClosedHint,
  VENUE_DIST_JA,
  venueHorseRowHtml,
  venueStyleLabel,
  type VenueSlot,
} from "./venueBoard.ts";
import { VENUE_CSS } from "./venueCss.ts";

export type { VenueSlot };
export { resolveVenueSlot } from "./venueBoard.ts";

export function venueCloseHm(ms: number | null): string {
  const t = toJstInput(ms);
  return t ? t.slice(11, 16) : "—";
}

/** 盤見出し。評価点の記号は出さない。芝・稍重は開催条件の見た目 */
export function venueBoardHead(board: Board): string {
  const bits = [board.event.title, "単勝"];
  const setup = eventScoreSetup(board.event);
  if (setup) {
    const course = getScoreCourse(setup.conditions.courseKey);
    if (course) {
      const surface =
        course.groundType === 2 ? "ダート" : course.groundType === 1 ? "芝" : "";
      const dist = VENUE_DIST_JA[course.distanceType] ?? "";
      if (surface && dist) bits.push(`${surface}・${dist}`);
      else if (surface) bits.push(surface);
    }
    const g = GROUND_CONDITION_OPTIONS.find(
      (o) => o.value === setup.conditions.groundCondition,
    );
    if (g) bits.push(g.label);
  }
  return bits.join("　");
}

export function venueWinSheetRows(board: Board): string {
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

function venueChromeScript(): string {
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

  const moreBtn = document.getElementById("more-btn");
  const morePop = document.getElementById("more-pop");
  const howto = document.getElementById("howto-modal");
  if (moreBtn && morePop) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const on = morePop.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", on ? "true" : "false");
    });
    document.addEventListener("click", () => {
      morePop.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    });
    morePop.addEventListener("click", (e) => e.stopPropagation());
  }
  const openHowto = (ev) => {
    ev.preventDefault();
    if (howto && howto.showModal) howto.showModal();
    if (morePop && moreBtn) {
      morePop.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    }
  };
  document.getElementById("howto-open")?.addEventListener("click", openHowto);
  document.getElementById("howto-out")?.addEventListener("click", openHowto);
  if (howto) {
    howto.addEventListener("click", (ev) => {
      const r = howto.getBoundingClientRect();
      const inside =
        ev.clientX >= r.left && ev.clientX <= r.right &&
        ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) howto.close();
    });
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
}): string {
  const closed = opts.board.event.status === "closed";
  const who = opts.user
    ? `${escapeHtml(opts.user.display_name)} · ${formatPt(opts.user.balance)}`
    : "";
  const logout = opts.user
    ? `<a href="/logout">ログアウト</a>`
    : "";
  const ctaHref = opts.user ? "/bet" : "/login";
  const closeHm = venueCloseHm(opts.board.event.voting_closes_at);
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const rows = venueWinSheetRows(opts.board);
  const pillClass = closed ? "pill idle" : "pill";
  const phaseLabel = closed ? "投票締切" : "投票中";
  const metaNow = closed
    ? ""
    : `<span id="meta-now">現在 <strong id="now-clock"></strong></span>`;
  const metaClose = closed
    ? `<span id="meta-close">確定配当</span>`
    : `<span id="meta-close">締切 <strong>${escapeHtml(closeHm)}</strong></span>`;
  const foot = closed
    ? `<div class="foot"><span class="hint" id="phase-hint">${escapeHtml(venueClosedHint(opts.board))}</span></div>`
    : `<div class="foot"><a class="cta" href="${ctaHref}">馬券を買う</a></div>`;
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
  <div class="scene" data-slot="${opts.slot}" data-phase="${closed ? "closed" : "voting"}">
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      <header class="chrome">
        <div>
          <a class="brand" href="/">OSHI KEIBA</a>
          <div class="who" id="who-line">${who}</div>
        </div>
        <div class="chrome-end">
          <div class="led-meta">
            <span class="${pillClass}" id="phase-pill"><span class="dot"></span><span id="phase-label">${phaseLabel}</span></span>
            ${metaNow}
            ${metaClose}
          </div>
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
        </div>
        <div class="cols">
          <div class="sheet-wrap">
            <div class="sheet" role="table" aria-label="単勝オッズ">
              <div class="sheet-row head" role="row">
                <span class="c-num" role="columnheader">#</span>
                <span class="c-name" role="columnheader">ウマ娘</span>
                <span class="c-runner" role="columnheader">出走者</span>
                <span class="c-style" role="columnheader">脚質</span>
                <span class="c-odds" role="columnheader">オッズ</span>
              </div>
              <div id="rows-a">${rows}</div>
            </div>
          </div>
          <div class="sheet-wrap col-b">
            <div class="sheet" role="table" aria-label="単勝オッズ 続き">
              <div class="sheet-row head" role="row">
                <span class="c-num" role="columnheader">#</span>
                <span class="c-name" role="columnheader">ウマ娘</span>
                <span class="c-runner" role="columnheader">出走者</span>
                <span class="c-style" role="columnheader">脚質</span>
                <span class="c-odds" role="columnheader">オッズ</span>
              </div>
              <div id="rows-b"></div>
            </div>
          </div>
        </div>
        ${foot}
      </section>
    </div>
  </div>
  <nav class="out-links" aria-label="その他">
    <a href="#" id="howto-out">使い方</a>
    <a href="/admin">管理者</a>
  </nav>
  ${howToModal()}
  ${venueChromeScript()}
  ${opts.scripts ?? ""}
</body>
</html>`;
}
