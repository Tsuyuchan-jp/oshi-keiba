/** 窓口（quiet）。マークカード。骨格は memberShellCss */
import {
  MEMBER_OVERLAY_CSS,
  MEMBER_QUIET_FRAME_CSS,
} from "./memberShellCss.ts";

export const BET_CSS = `
${MEMBER_QUIET_FRAME_CSS}
${MEMBER_OVERLAY_CSS}
:root { --shell-max: 36rem; }
.nav a {
  color: var(--member-muted);
  text-decoration: none;
  font-size: .78rem;
  margin-left: .65rem;
}
.nav a.on { color: var(--member-accent); }
.pill {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .55rem; border-radius: 999px;
  background: rgba(224, 179, 74, .15); color: var(--member-accent);
  font-size: .68rem; font-weight: 700; letter-spacing: .06em;
}
.pill .dot {
  width: .45rem; height: .45rem; border-radius: 50%; background: currentColor;
  animation: blink 1.2s step-end infinite;
}
.pill.idle .dot { animation: none; opacity: .85; }
@keyframes blink { 50% { opacity: 0; } }
.purse {
  flex: 0 0 auto;
  display: flex; align-items: baseline; justify-content: space-between; gap: .75rem;
  padding: .4rem .7rem; background: var(--member-field-bg); border-bottom: 1px solid var(--member-panel-line);
}
.purse .k { font-size: .7rem; letter-spacing: .08em; color: var(--member-muted); }
.purse .v {
  font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums;
  letter-spacing: .02em; color: var(--member-white);
}
.purse .u { font-size: .78rem; font-weight: 600; color: #8a9490; margin-left: .25rem; }
.desk {
  display: flex; flex-direction: column; padding: 0; overflow: hidden; flex: 1; min-height: 0;
}
.desk-scroll {
  flex: 1; min-height: 0; overflow: auto; padding: .65rem .7rem 5.5rem;
}
.desk-plain { padding: 1.1rem 1rem 1.15rem; overflow: auto; flex: 1; min-height: 0; }
.desk-plain h1 {
  margin: 0 0 .35rem; font-size: 1.2rem; letter-spacing: .14em; color: var(--member-ink);
}
.desk-plain .lead {
  margin: 0 0 1rem; font-size: .8rem; color: var(--member-muted); line-height: 1.55;
}
.kinds {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: .65rem;
}
.kinds a, .kinds span {
  display: block; text-align: center; text-decoration: none;
  border: 1px solid var(--member-field-line); background: var(--member-panel-bg); color: #8a9490;
  padding: .45rem 0; font-size: .72rem; font-weight: 700;
}
.kinds a.on, .kinds span.on {
  background: var(--member-accent-bg); color: var(--member-accent); border-color: var(--member-accent);
}
.kinds span { opacity: .35; cursor: default; }
.hint { margin: 0 0 .45rem; font-size: .75rem; color: var(--member-muted); }
.wells { display: flex; gap: 6px; margin-bottom: .55rem; }
.well {
  flex: 1; min-height: 3.1rem; border: 1px dashed var(--member-line-strong); background: var(--member-field-bg);
  padding: .35rem .4rem; text-align: left; cursor: pointer; color: var(--member-muted); font: inherit;
}
.well.fill { border-style: solid; border-color: var(--member-accent); color: var(--member-ink-bright); }
.well .k { display: block; font-size: .65rem; color: var(--member-muted); margin-bottom: .1rem; }
.well .v { font-weight: 700; font-size: .85rem; }
.well .o { color: var(--member-action); font-size: .72rem; margin-left: .25rem; }
.board { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.chip {
  display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) auto; gap: .3rem;
  align-items: center; padding: .4rem .4rem; border: 1px solid var(--member-field-line);
  background: var(--member-panel-bg); color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.chip .n { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--member-ink-soft); }
.chip .uma {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem;
}
.chip .od { color: #8a8070; font-size: .72rem; font-variant-numeric: tabular-nums; }
.chip.on { border-color: var(--member-accent); background: #1a1610; }
.chip.on .n, .chip.on .uma { color: var(--member-accent); }
.chip.used:not(.on) { opacity: .4; }
@keyframes pulse-row {
  0% { background: rgba(255, 138, 42, .28); }
  100% { background: transparent; }
}
.chip.pulse-row,
.orow.pulse-row { animation: pulse-row 1.5s ease-out; }
.t-row.pulse-hit,
.orow.pulse-hit { animation: pulse-row 1.5s ease-out; background: rgba(255, 138, 42, .18); }
.odds-mini { margin: .85rem 0 0; font-size: .78rem; }
.odds-mini h2 {
  font-size: .72rem; color: var(--member-muted); margin: 0 0 .35rem; letter-spacing: .08em; font-weight: 600;
}
.orow {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .35rem;
  padding: .28rem 0; border-bottom: 1px solid var(--member-table-line); color: var(--member-ink-soft);
}
.orow .odds-now { color: var(--member-action); font-variant-numeric: tabular-nums; font-weight: 700; }
.tickets {
  margin-top: .9rem; border-top: 1px solid var(--member-panel-line); padding-top: .55rem;
}
.tickets h2 {
  margin: 0 0 .35rem; font-size: .72rem; letter-spacing: .08em; color: var(--member-muted); font-weight: 600;
}
.t-row {
  display: flex; justify-content: space-between; gap: .5rem;
  padding: .28rem 0; font-size: .82rem; border-bottom: 1px solid var(--member-table-line);
}
.text-btn {
  background: none; border: 0; color: var(--member-muted); text-decoration: underline;
  cursor: pointer; font: inherit; padding: .5rem 0 0;
}
.dock {
  flex: 0 0 auto;
  display: grid; grid-template-columns: 1fr auto; gap: .55rem; align-items: center;
  padding: .55rem .7rem calc(.55rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--member-field-line); background: #0a0c0d;
}
.amt-box { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
.amt-row { display: flex; gap: 4px; flex-wrap: wrap; }
.amt-row button {
  border: 1px solid var(--member-field-line); background: #161a1c; color: var(--member-table-ink);
  padding: .28rem .45rem; font: inherit; font-size: .72rem; cursor: pointer;
}
.amt-show { font-size: .78rem; color: var(--member-muted); }
.amt-show b {
  color: var(--member-white); font-size: 1.15rem; font-variant-numeric: tabular-nums; margin-left: .25rem;
}
.amt-show .rest { display: block; font-size: .68rem; color: var(--member-muted); margin-top: .1rem; }
.amt-show .rest b { color: var(--member-ink-soft); font-weight: 700; font-size: inherit; margin-left: 0; }
.buy {
  background: var(--member-action); color: var(--member-action-ink); border: 0;
  padding: .85rem 1.25rem; font: inherit; font-weight: 800;
  letter-spacing: .12em; cursor: pointer; min-width: 7.5rem;
}
.buy:disabled { opacity: .35; cursor: not-allowed; }
.join-btn {
  width: 100%; background: var(--member-action); color: var(--member-action-ink); border: 0;
  padding: .85rem 1rem; font: inherit; font-weight: 800; letter-spacing: .12em; cursor: pointer;
}
.flash {
  margin: 0 0 .55rem; padding: .45rem .6rem; background: var(--member-accent-bg);
  border: 1px solid var(--member-accent); color: var(--member-accent); font-size: .82rem;
}
.flash.error { border-color: var(--member-danger); color: var(--member-danger-ink); }
.admin-preview {
  margin: 0 0 .55rem; padding: .45rem .6rem;
  border: 1px solid var(--member-accent); background: var(--member-accent-bg);
  color: var(--member-accent); font-size: .78rem; font-weight: 700;
}
@media (min-width: 900px) {
  .app-shell { max-height: calc(100dvh - 3rem); }
}
`;
