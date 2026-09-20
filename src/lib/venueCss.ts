/** 場内電光。オーバーレイは memberShellCss。LED・盤面はここ */
import {
  MEMBER_MOBILE_GLASS_CSS,
  MEMBER_MOBILE_CHROME_CSS,
  MEMBER_OVERLAY_CSS,
  MEMBER_TOKENS_CSS,
} from "./memberShellCss.ts";
import { umabashiraPaperCss } from "./adminCss.ts";

export const VENUE_CSS = `
${MEMBER_TOKENS_CSS}
:root {
  --bg: #070808;
  --led: #00e8d8;
  --led-dim: var(--member-muted);
  --odds: var(--member-action);
  --pulse: rgba(255, 138, 42, .28);
  --line: var(--member-chrome-line);
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: var(--member-page-bg);
  color: var(--member-ink-bright);
  font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.app-shell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chrome {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .55rem .85rem;
  background: var(--member-black);
  border-bottom: 1px solid var(--member-chrome-line);
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  letter-spacing: .04em;
  line-height: 1.2;
}
.chrome .brand {
  color: var(--led);
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .12em;
  text-decoration: none;
}
.who { color: var(--led-dim); font-size: .72rem; margin-top: .15rem; }
.chrome-end {
  position: relative;
  display: flex;
  align-items: center;
  gap: .35rem;
  flex: 0 0 auto;
}
.site-nav { display: flex; align-items: center; gap: .65rem; white-space: nowrap; }
.site-nav a { color: var(--led-dim); font-size: .78rem; text-decoration: none; }
.site-nav a.on { color: var(--member-accent); font-weight: 700; }
.chrome-menu { position: relative; }
.venue-chrome .chrome-state { margin-left: auto; }
${MEMBER_OVERLAY_CSS}
.led-meta {
  display: flex;
  align-items: center;
  gap: .85rem;
  color: var(--led);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: .82rem;
  line-height: 1;
}
.led-meta > span { display: inline-flex; align-items: center; }
.led-meta .chrome-times { gap: .85rem; }
.led-meta #meta-now,
.led-meta #meta-close { gap: .25em; }
.led-meta strong { color: var(--member-white); font-weight: 700; }
.pill {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .55rem;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: .06em;
  font-size: .68rem;
  background: rgba(224, 179, 74, .15);
  color: var(--member-accent);
  border: 0;
}
.pill .dot {
  width: .45rem;
  height: .45rem;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.2s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.board {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: .35rem .45rem .55rem;
  overflow: auto;
}
.board-head {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .35rem;
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  color: var(--led);
}
.board-head h1 {
  margin: 0;
  font-size: clamp(.95rem, 2.2vw, 1.15rem);
  letter-spacing: .14em;
  font-weight: 700;
}
.board-head-title,
.board-head-detail { display: inline; }
.sheet-wrap {
  background: var(--member-black);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.sheet {
  --col-num: 1.55rem;
  --col-runner: 5.5rem;
  --col-style: 1.7rem;
  --col-odds: 6.2rem;
  --col-place: 0px;
  --sheet-pad-y: .32rem;
  font-size: clamp(.78rem, 1.8vw, .9rem);
}
.scene[data-phase="published"] .sheet { --col-place: 2.6rem; }
.sheet-row {
  display: grid;
  grid-template-columns:
    var(--col-num)
    minmax(0, 1fr)
    var(--col-runner)
    var(--col-style)
    var(--col-odds)
    var(--col-place);
  align-items: center;
  column-gap: .2rem;
  padding: var(--sheet-pad-y) .15rem;
  border-bottom: 1px solid #0c1818;
}
.sheet-row.head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--member-black);
  color: var(--led-dim);
  font-weight: 500;
  letter-spacing: .12em;
  font-size: .68rem;
  border-bottom: 1px solid #143230;
}
.c-num {
  color: var(--member-white);
  font-family: "Chakra Petch", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 0 6px rgba(255,255,255,.25);
}
.c-name {
  color: var(--led);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 8px rgba(0, 232, 216, .25);
}
.c-runner {
  color: var(--member-table-ink);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-style {
  color: var(--led);
  font-size: .78em;
  text-align: center;
  white-space: nowrap;
}
.c-odds {
  color: var(--odds);
  font-family: "Chakra Petch", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1.15em;
  text-align: right;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(255, 138, 42, .35);
}
.sheet-row.head .c-odds { color: var(--led-dim); font-size: .68em; text-shadow: none; }
.c-place {
  display: none;
  color: var(--member-white);
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  padding: .06rem 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: none;
  box-shadow: none;
}
.scene[data-phase="published"] .c-place { display: block; }
.sheet-row.head .c-place {
  color: var(--led-dim);
  font-size: .68em;
  border-color: transparent;
  text-shadow: none;
}
/* 1〜3着は電光アウトライン。塗りは置かない */
.c-place.place-1 {
  color: #f0c85a;
  border-color: #e0b34a;
  text-shadow: 0 0 8px rgba(224, 179, 74, .55);
}
.c-place.place-2 {
  color: #e8eef2;
  border-color: #c5d0d8;
  text-shadow: 0 0 8px rgba(210, 220, 230, .4);
}
.c-place.place-3 {
  color: #e09a58;
  border-color: #c47a3a;
  text-shadow: 0 0 8px rgba(196, 122, 58, .5);
}
@keyframes pulse-row {
  0% { background: var(--pulse); }
  100% { background: transparent; }
}
.sheet-row.pulse,
.sheet-row.pulse-row { animation: pulse-row 1.5s ease-out; }
.led-meta .pill.idle .dot { animation: none; opacity: .85; }
.led-meta .pill.done {
  background: rgba(0, 232, 216, .12);
  color: var(--led);
}
.foot .hint {
  color: var(--led-dim);
  font-size: .72rem;
  line-height: 1.45;
}
.result-tabs {
  display: none;
  gap: .35rem;
  margin-left: auto;
  flex: 0 0 auto;
}
.scene[data-phase="published"] .result-tabs { display: flex; }
.result-tabs button {
  border: 1px solid #2a4040;
  background: transparent;
  color: var(--led-dim);
  font: inherit;
  font-size: .68rem;
  letter-spacing: .08em;
  padding: .2rem .45rem;
  cursor: pointer;
}
.result-tabs button[aria-pressed="true"] {
  color: var(--member-accent);
  border-color: var(--member-accent);
}
.jumbo {
  display: none;
  flex: 1 1 auto;
  min-height: 0;
  gap: 8px;
}
.scene[data-phase="published"][data-result="show"] .jumbo { display: flex; }
.scene[data-phase="published"][data-result="show"] .cols,
.scene[data-phase="published"][data-result="show"] .tickets { display: none; }
.j-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #0a0a0a;
  border: 1px solid #1c3030;
  display: flex;
  flex-direction: column;
}
.j-pay { flex: 1 1 auto; }
.j-fin {
  flex: 0 0 19rem;
  width: 19rem;
  background: #020202;
  border-color: #2a2a2a;
}
.j-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  padding: .28rem .45rem;
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  font-weight: 700;
  letter-spacing: .08em;
  font-size: .78rem;
  flex: 0 0 auto;
}
.j-pay .j-head { background: #5aa0d0; color: var(--member-white); font-size: .95rem; padding: .4rem .55rem; }
.j-pay .j-body {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: .2rem .55rem .35rem;
}
.fin-top {
  display: grid;
  grid-template-columns: 1.15rem minmax(0, 1fr) auto;
  align-items: center;
  gap: .35rem;
  padding: .35rem .4rem .2rem;
  flex: 0 0 auto;
}
.fin-place {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: .75rem;
  letter-spacing: .18em;
  color: #f2f2f2;
  line-height: 1;
  height: 2.9rem;
}
.fin-r {
  font-family: "Chakra Petch", sans-serif;
  color: var(--member-white);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: .04em;
}
.kakutei {
  background: #d0121c;
  color: var(--member-white);
  padding: .34rem .5rem;
  letter-spacing: .28em;
  font-size: .92rem;
  font-weight: 800;
  box-shadow: 0 0 12px rgba(208, 18, 28, .55);
}
.j-body { padding: .35rem .4rem .45rem; flex: 1; }
.j-fin .j-body {
  padding: .15rem .45rem .4rem;
  display: flex;
  flex-direction: column;
}
.fin-rows { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-evenly; }
.fin-row {
  display: grid;
  grid-template-columns: 2.05rem 4.15rem minmax(0, 1fr);
  gap: .18rem .3rem;
  align-items: center;
  padding: .1rem 0;
  border: 0;
}
.fin-rk {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #3d7eb8;
  color: var(--member-white);
  font-size: .7rem;
  font-weight: 800;
  font-family: "Chakra Petch", sans-serif;
}
.fin-n {
  font-family: "Chakra Petch", sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  line-height: .9;
  color: #ffd000;
  text-shadow: 0 0 12px rgba(255, 208, 0, .4);
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
}
.fin-uma {
  min-width: 0;
  font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
  font-size: .62rem;
  font-weight: 400;
  color: rgba(255, 208, 0, .62);
  letter-spacing: .04em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fin-foot {
  flex: 0 0 auto;
  margin-top: .2rem;
  padding-top: .3rem;
  border-top: 1px solid #222;
  color: #ffd000;
  font-size: .85rem;
  letter-spacing: .04em;
  line-height: 1.45;
}
.fin-foot b {
  display: inline-block;
  margin-left: .25rem;
  padding: 0 .28rem;
  background: #ffd000;
  color: #111;
  font-weight: 800;
}
.pay-row {
  display: grid;
  grid-template-columns: 4.4rem minmax(0, 1fr) auto;
  gap: .45rem;
  align-items: center;
  padding: .42rem 0;
  border-bottom: 1px solid var(--member-table-line);
  font-size: 1.12rem;
}
.pay-k {
  font-size: .88rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-align: center;
  padding: .32rem 0;
  color: #0a0a0a;
}
.pay-k.win { background: #4a8fd4; }
.pay-k.umaren { background: #e070a0; }
.pay-k.umatan { background: var(--member-accent); }
.pay-k.trio { background: #5ec4d4; }
.pay-k.trif { background: #e07a30; }
.pay-sel {
  font-family: "Chakra Petch", sans-serif;
  font-weight: 700;
  font-size: 1.22em;
  font-variant-numeric: tabular-nums;
  color: var(--member-white);
}
.pay-amt {
  font-family: "Chakra Petch", sans-serif;
  font-weight: 700;
  font-size: 1.22em;
  font-variant-numeric: tabular-nums;
  color: #ffe14a;
  text-align: right;
  white-space: nowrap;
}
.pay-amt.void { color: var(--led); font-size: .92em; }
.jumbo-hint {
  display: none;
  flex: 0 0 auto;
  margin: .35rem 0 0;
  font-size: .68rem;
  color: var(--led-dim);
  letter-spacing: .06em;
}
.scene[data-phase="published"][data-result="show"] .jumbo-hint { display: block; }
.jumbo-hint .jh-narrow { display: none; }
.scene[data-phase="published"] .foot:not(:has(#phase-hint:not(:empty))) { display: none; }
.tickets {
  display: none;
  flex: 0 0 auto;
  margin-top: .35rem;
  padding-top: .3rem;
  border-top: 1px solid #143230;
}
.scene[data-phase="published"][data-result="field"] .tickets { display: block; }
.tickets-h {
  font-size: .68rem;
  letter-spacing: .12em;
  color: var(--led-dim);
  margin: 0 0 .2rem;
}
.t-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: .55rem;
  align-items: baseline;
  font-size: .78rem;
  padding: .12rem 0;
  border-bottom: 1px solid #0c1818;
}
.t-row .lab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.t-row .yen { font-variant-numeric: tabular-nums; color: var(--member-table-ink); }
.t-row .res { color: var(--led-dim); white-space: nowrap; }
.t-row .res.hit { color: var(--odds); font-weight: 700; }
.cta {
  background: var(--odds);
  color: var(--member-action-ink);
  border: 0;
  border-radius: 2px;
  padding: .65rem 1.35rem;
  font-size: .95rem;
  font-weight: 800;
  letter-spacing: .12em;
  box-shadow: 0 0 18px rgba(255, 138, 42, .35);
  text-decoration: none;
  display: inline-block;
  text-align: center;
}
.cta:hover { filter: brightness(1.08); }
.foot-actions { display: flex; align-items: center; gap: .5rem; }
.foot-voting { display: flex; align-items: center; gap: .5rem; }
.foot-browse { display: flex; align-items: center; gap: .5rem; }
.umabashira-cta {
  padding: .62rem 1rem;
  border: 1px solid var(--member-line-strong);
  border-radius: 2px;
  color: var(--member-ink-bright);
  background: var(--member-panel-bg);
  font: inherit;
  font-size: .83rem;
  font-weight: 800;
  letter-spacing: .06em;
  cursor: pointer;
}
.umabashira-cta:hover { border-color: var(--led); background: var(--member-field-bg); }
.paddock-cta {
  display: inline-block;
  padding: .62rem 1rem;
  border: 1px solid var(--led-dim);
  border-radius: 2px;
  color: var(--led);
  background: rgba(0, 232, 216, .08);
  font-size: .83rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-align: center;
  text-decoration: none;
}
.paddock-cta:hover { background: rgba(0, 232, 216, .16); }
.foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .5rem;
  margin-top: .45rem;
}
.scene[data-phase="setup"] .foot .hint,
.scene[data-phase="closed"] .foot .hint {
  flex: 1 1 auto;
  min-width: 0;
}
.scene[data-phase="setup"] .foot > .paddock-cta,
.scene[data-phase="closed"] .foot > .paddock-cta {
  flex: 0 0 auto;
}
.cols { display: flex; gap: 0; min-height: 0; flex: 1; }
.cols .sheet-wrap { flex: 1; }
/* ローカルの連勝盤表示試作。通常の単勝盤には一切当てない。 */
.odds-preview .board-head { align-items: center; }
.odds-preview-tabs { display: flex; align-items: end; gap: .18rem; margin-left: auto; flex: 0 0 auto; }
.odds-preview-tabs button {
  border: 1px solid transparent;
  border-bottom: 0;
  background: transparent;
  color: var(--led-dim);
  font: inherit;
  font-size: .68rem;
  letter-spacing: .08em;
  padding: .2rem .42rem;
  cursor: pointer;
}
.odds-preview-tabs button[aria-selected="true"] { color: var(--odds); border-color: #31514d; background: #0b1313; font-weight: 700; }
.odds-preview [data-preview-view][hidden] { display: none !important; }
.odds-preview-market { --col-odds: 7rem; --sheet-pad-y: .42rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; min-height: 0; flex: 1 1 auto; }
.odds-preview-panel { min-width: 0; display: flex; flex-direction: column; background: var(--member-black); overflow: hidden; }
.odds-preview-panel-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: var(--sheet-pad-y) .15rem; color: var(--led-dim); font-size: .8rem; letter-spacing: .1em; border-bottom: 1px solid var(--line); }
.odds-preview-panel-head b { color: var(--member-ink-bright); font-size: .8rem; }
.odds-preview-panel-head span { font-size: .68rem; }
.odds-preview-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); min-height: 0; flex: 1 1 auto; }
.odds-preview-column + .odds-preview-column { border-left: 1px solid #152323; }
.odds-preview-row { display: grid; grid-template-columns: 1.55rem minmax(0, 1fr) var(--col-odds); align-items: center; column-gap: .2rem; padding: var(--sheet-pad-y) .15rem; border-bottom: 1px solid #0c1818; font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif; font-size: 1.1rem; line-height: 1.35; }
.odds-preview-row em { color: var(--led-dim); font-size: .78em; font-style: normal; font-variant-numeric: tabular-nums; }
.odds-preview-row span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--member-ink-bright); font-weight: 700; }
.odds-preview-row small { margin-left: .35rem; color: var(--member-accent); font-family: "IBM Plex Sans JP", sans-serif; font-size: .58rem; font-weight: 400; }
.odds-preview-odds { color: var(--odds); text-align: right; white-space: nowrap; font-family: "Chakra Petch", sans-serif; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 1.15em; text-shadow: 0 0 10px rgba(255, 138, 42, .35); }
.flash {
  flex: 0 0 auto;
  margin: 0 0 .4rem;
  padding: .45rem .6rem;
  background: var(--member-accent-bg);
  border: 1px solid var(--member-accent);
  color: var(--member-accent);
  font-size: .82rem;
}
.flash.error { border-color: var(--member-danger); color: var(--member-danger-ink); }
.scene {
  position: relative;
  min-height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
}
.scene-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: #0a1218;
  background-image:
    linear-gradient(180deg, var(--veil-top), var(--veil-bot)),
    var(--scene-portrait);
  background-position: center bottom, center bottom;
  background-size: cover, cover;
  background-repeat: no-repeat;
  transition: opacity .8s ease;
}
.scene .app-shell {
  position: relative;
  z-index: 3;
  background: #050505;
  border: 2px solid #d8dce0;
  border-radius: 2px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .55);
}
.scene[data-slot="day"] {
  --veil-top: rgba(20, 28, 36, .18);
  --veil-bot: rgba(12, 18, 16, .28);
  --scene-portrait: url("/venue/day-9x16.png");
  --scene-landscape: url("/venue/day-16x9.png");
}
.scene[data-slot="dusk"] {
  --veil-top: rgba(24, 12, 8, .28);
  --veil-bot: rgba(18, 10, 8, .38);
  --scene-portrait: url("/venue/dusk-9x16.png");
  --scene-landscape: url("/venue/dusk-16x9.png");
}
.scene[data-slot="night"] {
  --veil-top: rgba(5, 6, 10, .38);
  --veil-bot: rgba(5, 8, 6, .48);
  --scene-portrait: url("/venue/night-glass-9x16.png");
  --scene-landscape: url("/venue/night-16x9.png");
}
@media (max-width: 899px) {
  .scene { height: 100dvh; min-height: 0; }
  .scene .app-shell {
    height: calc(100% - 28px);
    margin: 14px;
    width: calc(100% - 28px);
    overflow: hidden;
  }
  .col-b { display: none; }
  .jumbo { flex-direction: column; }
  .j-pay { flex: 1 1 auto; }
  .j-fin { flex: 1.15 1 auto; width: auto; max-width: 22rem; margin: 0 auto; min-height: 21rem; }
  .foot { display: block; }
  .foot-voting { display: grid; grid-template-columns: 1fr; gap: .45rem; }
  .foot-browse { display: grid; grid-template-columns: 1fr; gap: .45rem; margin-top: .45rem; }
  .umabashira-cta { width: 100%; min-height: 2.55rem; }
  /* 昼背景では二重の透過を避け、足元のグラス面に馴染む深緑青で固定する。 */
  .scene[data-slot="day"] .umabashira-cta {
    background: #16443d;
    border-color: #86cfc4;
    color: #f2fffc;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12);
  }
  .foot > .paddock-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: .45rem;
    box-sizing: border-box;
  }
  .foot-actions { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.25fr); }
  .cta {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: .8rem 1rem;
  }
  .foot-actions .cta { width: auto; }
  .foot-actions .paddock-cta { display: flex; align-items: center; justify-content: center; }
  .foot-browse .paddock-cta { display: flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; }
  .board-head h1 { display: flex; flex-direction: column; align-items: flex-start; gap: .12rem; }
  .board-head-title,
  .board-head-detail { display: block; }
  .jumbo-hint .jh-wide { display: none; }
  .jumbo-hint .jh-narrow { display: inline; }
}
${umabashiraPaperCss()}
.umabashira-modal .umabashira-paper .board { flex: none; padding: 0; overflow: visible; }
.umabashira-modal .umabashira-paper .who { margin-top: 0; color: inherit; font-size: inherit; }
.umabashira-modal {
  width: min(96vw, 80rem);
  height: min(92dvh, 52rem);
  max-width: none;
  max-height: none;
  padding: 0;
  border: 1px solid var(--member-line-strong);
  background: #111517;
  color: var(--member-ink-bright);
  overflow: hidden;
}
.umabashira-modal[open] { display: flex; flex-direction: column; }
.umabashira-modal::backdrop { background: rgba(0, 0, 0, .78); }
.umabashira-modal-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .55rem .7rem;
  border-bottom: 1px solid var(--member-chrome-line);
  background: var(--member-black);
}
.umabashira-modal-head h2 { margin: 0; color: var(--led); font-size: 1rem; }
.umabashira-modal-head p { margin: .12rem 0 0; color: var(--member-muted); font-size: .7rem; }
.umabashira-modal-tools { display: flex; align-items: center; gap: .35rem; }
.umabashira-modal-tools button {
  min-height: 2.1rem;
  padding: .3rem .65rem;
  border: 1px solid var(--member-line-strong);
  border-radius: 2px;
  background: var(--member-panel-bg);
  color: var(--member-ink-bright);
  font: inherit;
  font-size: .78rem;
  cursor: pointer;
}
.umabashira-modal-tools .umabashira-modal-close { margin-left: .25rem; border-color: var(--led-dim); color: var(--led); }
.umabashira-viewport {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  overflow: hidden;
  touch-action: none;
  background:
    radial-gradient(ellipse at 12% 10%, rgba(0, 232, 216, .12), transparent 34%),
    radial-gradient(ellipse at 88% 88%, rgba(255, 138, 42, .09), transparent 38%),
    linear-gradient(145deg, rgba(19, 36, 37, .88), rgba(8, 16, 17, .76));
  cursor: grab;
}
.umabashira-viewport::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(159, 229, 220, .06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(159, 229, 220, .06) 1px, transparent 1px);
  background-size: 2rem 2rem;
}
.umabashira-viewport:active { cursor: grabbing; }
.umabashira-viewport,
.umabashira-viewport * { user-select: none; -webkit-user-select: none; }
.umabashira-canvas {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: max-content;
  transform-origin: 0 0;
}
@media (min-width: 900px) {
  .umabashira-modal {
    background: rgba(7, 14, 15, .82);
    backdrop-filter: blur(10px);
  }
  .umabashira-modal::backdrop {
    background: rgba(0, 0, 0, .54);
    backdrop-filter: blur(3px);
  }
}
@media (max-width: 899px) {
  .umabashira-modal {
    width: 100vw;
    height: 100dvh;
    border: 0;
  }
  .umabashira-modal-head { gap: .4rem; padding-top: calc(.45rem + env(safe-area-inset-top)); }
  .umabashira-modal-head p { max-width: 12rem; }
  .umabashira-modal-tools { gap: .2rem; }
  .umabashira-modal-tools button { min-width: 2.2rem; padding: .3rem .45rem; }
  .umabashira-modal-tools #umabashira-zoom-reset { display: none; }
}
${MEMBER_MOBILE_CHROME_CSS}
@media (min-width: 900px) {
  .scene {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    height: 100vh;
  }
  .scene-bg {
    background-image:
      linear-gradient(180deg, var(--veil-top), var(--veil-bot)),
      var(--scene-landscape);
    background-position: center, center;
  }
  /* PC: 横幅は従来。高さ上限と単勝表の字、トレーナー列だけ広げる。モバイルの clamp 上限は触らない */
  .sheet {
    font-size: 1.1rem;
    --sheet-pad-y: .42rem;
    --col-runner: 9rem;
    --col-odds: 7rem;
  }
  .sheet-row.head { font-size: .8rem; }
  .c-odds { font-size: 1.25rem; }
  .sheet-row.head .c-odds,
  .sheet-row.head .c-place { font-size: .8rem; }
  .scene .app-shell {
    width: min(68rem, calc(100vw - 4rem));
    height: auto;
    max-height: calc(100dvh - 3rem);
    margin: 0;
    overflow: hidden;
  }
  .foot { justify-content: flex-end; }
  .foot-actions .cta { min-width: 11rem; }
  .scene[data-phase="setup"] .foot,
  .scene[data-phase="closed"] .foot { justify-content: space-between; }
  .scene[data-phase="published"] .foot { justify-content: flex-start; }
  .cta { min-width: 11rem; text-align: center; }
  /* 2列は隙間で分ける。外枠は出さず、見出し下の横線だけ残す */
  .cols { gap: .85rem; }
  .cols .sheet-wrap { min-width: 0; }
}
.scene[data-phase="closed"] .cta,
.scene[data-phase="published"] .cta,
.scene[data-phase="setup"] .cta { display: none; }
.scene[data-phase="closed"] #meta-now,
.scene[data-phase="published"] #meta-now { display: none; }
${MEMBER_MOBILE_GLASS_CSS}
/* スマホ published: ページ全体をスクロール。ヘッダーも流す。枠内スクロールはしない */
@media (max-width: 899px) {
  html:has(body[data-phase="published"]),
  body[data-phase="published"] {
    height: auto;
    min-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .scene[data-phase="published"] {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }
  .scene[data-phase="published"] .scene-bg { position: fixed; }
  .scene[data-phase="published"] .app-shell {
    height: auto;
    min-height: calc(100dvh - 28px);
    overflow: visible;
  }
  .scene[data-phase="published"] .board,
  .scene[data-phase="published"] .j-panel,
  .scene[data-phase="published"] .sheet-wrap {
    overflow: visible;
  }
  /* 全頭表の行が狭い画面で横に広がっても、枠の外へ罫線を描画しない */
  .scene[data-phase="published"] .sheet-wrap { overflow-x: clip; }
  .scene[data-phase="published"] .board,
  .scene[data-phase="published"] .jumbo,
  .scene[data-phase="published"] .cols,
  .scene[data-phase="published"] .j-pay,
  .scene[data-phase="published"] .j-fin {
    flex: 0 0 auto;
    min-height: 0;
  }
  .scene[data-phase="published"] .j-fin { width: 100%; }
  /* 全頭: 脚質を外しオッズを縮めてウマ娘9文字分を確保。PC・投票中は触らない */
  .scene[data-phase="published"] .sheet { --col-odds: 3.4rem; }
  .scene[data-phase="published"] .c-style { display: none; }
  .scene[data-phase="published"] .sheet-row {
    grid-template-columns:
      var(--col-num)
      minmax(0, 1fr)
      var(--col-runner)
      var(--col-odds)
      var(--col-place);
  }
  .odds-preview .board-head { align-items: flex-start; }
  .odds-preview-tabs { margin-left: 0; margin-top: .2rem; max-width: 100%; overflow-x: auto; }
  .odds-preview-market { grid-template-columns: 1fr; overflow: auto; }
  .odds-preview-panel + .odds-preview-panel { margin-top: .45rem; }
  .odds-preview-panel-head { font-size: .68rem; }
  .odds-preview-panel-head b { font-size: .82rem; }
  .odds-preview-row { font-size: .9rem; }
  .odds-preview-row b { font-size: 1.05rem; }
}
`;
