/** 場内電光。オーバーレイは memberShellCss。LED・盤面はここ */
import { MEMBER_OVERLAY_CSS, MEMBER_TOKENS_CSS } from "./memberShellCss.ts";

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
}
.chrome .brand {
  color: var(--led);
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .12em;
  text-decoration: none;
}
.who { color: var(--led-dim); font-size: .72rem; margin-top: .2rem; }
.chrome-end {
  position: relative;
  display: flex;
  align-items: center;
  gap: .35rem;
  flex: 0 0 auto;
}
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
.scene[data-phase="published"] .sheet { --col-place: 1.85rem; }
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
  font-family: "Chakra Petch", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}
.scene[data-phase="published"] .c-place { display: block; }
.sheet-row.head .c-place { color: var(--led-dim); font-size: .68em; }
.sheet-row.place-1 { box-shadow: inset 3px 0 0 var(--member-accent); }
.sheet-row.place-2 { box-shadow: inset 3px 0 0 var(--member-ink-soft); }
.sheet-row.place-3 { box-shadow: inset 3px 0 0 #c47a3a; }
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
.fin-place-lbl {
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  color: #ffd000;
  font-size: .95rem;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  letter-spacing: .08em;
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
.scene[data-phase="published"][data-result="show"] .foot .hint { display: none; }
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
.cols { display: flex; gap: 0; min-height: 0; flex: 1; }
.cols .sheet-wrap { flex: 1; }
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
  --scene-portrait: url("/venue/night-9x16.png");
  --scene-landscape: url("/venue/night-16x9.png");
}
@media (max-width: 899px) {
  .scene { height: 100dvh; height: 100vh; }
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
  .foot-actions { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.25fr); }
  .cta {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: .8rem 1rem;
  }
  .foot-actions .cta { width: auto; }
  .foot-actions .paddock-cta { display: flex; align-items: center; justify-content: center; }
}
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
  .scene .app-shell {
    width: min(68rem, calc(100vw - 4rem));
    height: auto;
    max-height: min(36rem, calc(100dvh - 4rem));
    margin: 0;
    overflow: hidden;
  }
  .foot { justify-content: flex-end; }
  .foot-actions .cta { min-width: 11rem; }
  .scene:not([data-phase="voting"]) .foot { justify-content: flex-start; }
  .cta { min-width: 11rem; text-align: center; }
}
.scene[data-phase="closed"] .cta,
.scene[data-phase="published"] .cta,
.scene[data-phase="setup"] .cta { display: none; }
.scene[data-phase="closed"] #meta-now,
.scene[data-phase="published"] #meta-now { display: none; }
`;
