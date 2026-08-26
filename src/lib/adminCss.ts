/** 管理ダッシュ用。メンバーの和紙・明朝・LED は載せない */
export const ADMIN_CSS = `
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: "IBM Plex Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #e6e8ed;
  color: #1c2128;
  -webkit-font-smoothing: antialiased;
  line-height: 1.55;
}
a { color: inherit; }
button, select, input, textarea { font: inherit; }
.dash {
  display: grid;
  grid-template-columns: 13.5rem minmax(0, 1fr);
  min-height: 100dvh;
}
.side {
  background: #1e242c;
  color: #c5ccd3;
  padding: .9rem .7rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: .35rem;
}
.side .mark {
  font-size: .72rem;
  letter-spacing: .14em;
  font-weight: 700;
  color: #8b95a0;
  padding: .35rem .55rem .7rem;
}
.side a {
  display: block;
  text-decoration: none;
  padding: .45rem .6rem;
  border-radius: 6px;
  color: #c5ccd3;
  font-size: .88rem;
}
.side a:hover { background: #2a323c; color: #fff; }
.side a.on { background: #2b6cb0; color: #fff; }
.side .side-foot { margin-top: auto; padding-top: 1rem; }
.side .side-foot a { color: #7a8490; font-size: .8rem; }
.main { min-width: 0; padding: 1rem 1.25rem 4.5rem; }
.hero, .work, .card {
  background: #fff;
  border: 1px solid #d5d9e0;
  border-radius: 10px;
}
.hero { padding: .9rem 1.05rem 1rem; margin-bottom: .85rem; }
.work, .card { padding: .85rem 1rem .95rem; margin-bottom: .75rem; }
.hero-top { display: flex; flex-wrap: wrap; align-items: baseline; gap: .55rem 1rem; }
.hero h1, .work h2, .card h1, .card h2 { margin: 0; }
.hero h1 { font-size: 1.25rem; }
.work h2, .card h2 { font-size: 1.02rem; margin-bottom: .55rem; }
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .55rem;
  margin-top: .75rem;
}
.kpi { background: #f4f6f9; border-radius: 8px; padding: .45rem .6rem .5rem; }
.kpi .k { display: block; font-size: .68rem; letter-spacing: .08em; color: #6b7380; font-weight: 700; }
.kpi .v { font-size: 1.15rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.ops-pair {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) 2fr;
  gap: .85rem 1.25rem;
  margin-top: .85rem;
}
.ops-k { font-size: .72rem; letter-spacing: .08em; color: #6b7380; margin: 0 0 .3rem; font-weight: 700; }
.ops-next { margin: 0; font-size: 1.02rem; font-weight: 700; line-height: 1.45; }
.ctas { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.phase {
  display: inline-block;
  font-size: .85rem;
  font-weight: 700;
  letter-spacing: .04em;
  padding: .22rem .6rem;
  border-radius: 8px;
  border: 1px solid #d5d9e0;
  background: #efe6d4;
}
.phase.voting { background: #e4f0e6; color: #2f5d3a; border-color: #2f5d3a; }
.phase.done { background: #f8eee8; color: #c45c2c; border-color: #c45c2c; }
.flash { background: #fff3d8; border: 1px solid #e4c98a; padding: .6rem .8rem; margin-bottom: .85rem; border-radius: 8px; }
.flash.error { background: #f8e4e0; border-color: #d9a59b; }
.card-head { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin: 0 0 .75rem; }
.card-head h2 { margin: 0; }
.muted, .note { color: #6b7380; font-size: .85rem; line-height: 1.5; }
.row { display: flex; flex-wrap: wrap; gap: .6rem; align-items: end; }
label { display: flex; flex-direction: column; gap: .25rem; font-size: .85rem; }
input, select, button, textarea {
  padding: .4rem .5rem;
  border-radius: 6px;
  border: 1px solid #c5ccd6;
}
input, select, textarea { background: #fff; color: inherit; }
button, .btn {
  background: #2b6cb0;
  color: #fff;
  border: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
button.secondary { background: #5c6570; }
button.danger { background: #a33; }
button.text-btn {
  background: none; color: #2b6cb0; padding: 0; border: 0; border-radius: 0; text-decoration: underline;
}
button:disabled, button[disabled] { opacity: .45; cursor: not-allowed; }
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; padding: .45rem .4rem; border-bottom: 1px solid #e2e6ec; }
th { font-size: .78rem; color: #6b7380; font-weight: 600; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.move-plus { color: #2f5d3a; font-weight: 700; }
.move-minus { color: #a33; font-weight: 700; }
.scr { opacity: .55; text-decoration: line-through; }
.kind-set { border: 1px solid #d5d9e0; padding: .55rem .8rem .7rem; margin: .75rem 0 0; }
.kind-set legend { padding: 0 .35rem; font-size: .85rem; }
.kind-opts { display: flex; flex-wrap: wrap; gap: .45rem 1rem; margin-top: .35rem; }
.kind-opt { display: inline-flex; flex-direction: row; align-items: center; gap: .35rem; font-size: .9rem; }
.ocr-out {
  font-size: .82rem; white-space: pre-wrap; background: #f4f6f9;
  padding: .6rem .7rem; min-height: 4rem; margin: .6rem 0 0;
}
dialog.modal {
  max-width: 38rem; width: calc(100% - 2rem); max-height: calc(100vh - 2rem);
  overflow: auto; border: 1px solid #d5d9e0; border-radius: 10px;
  padding: 1.1rem 1.2rem; background: #fff; color: #1c2128;
}
dialog.modal::backdrop { background: rgba(18, 22, 28, .45); }
dialog.modal h2 { margin-top: 0; }
.autofill-trap { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
form.reauth { position: relative; }
.eq, .plug { font-family: ui-monospace, "Cascadia Code", sans-serif; font-size: .9rem; line-height: 1.55; }
.story { font-size: .88rem; line-height: 1.7; margin: 0 0 .65rem; }
.story p { margin: 0 0 .55rem; }
.flow { display: flex; flex-direction: column; gap: .55rem; margin: 0 0 1rem; }
.flow-step { border-left: 3px solid #d5d9e0; padding: .5rem .75rem; background: #f4f6f9; }
.flow-k { font-size: .72rem; letter-spacing: .08em; color: #6b7380; margin-bottom: .2rem; }
.flow-arrow { text-align: center; color: #6b7380; font-size: .8rem; }
.terms { width: 100%; margin: .5rem 0 0; font-size: .82rem; }
details.terms-box summary { cursor: pointer; font-size: .9rem; padding: .35rem 0; }
.formula-box { overflow-x: auto; }
.tag {
  display: inline-block; font-size: .68rem; font-weight: 700;
  padding: .1rem .4rem; border-radius: 4px; background: #eef4fb; color: #2b6cb0;
}
.tag.warn { background: #f8eee4; color: #8a4b12; }
.work-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .4rem .75rem; margin-bottom: .35rem; }
.work-head h2 { margin: 0; }
.sort-links { font-size: .82rem; color: #5c6570; }
.sort-links a { color: #2b6cb0; text-decoration: none; }
.sort-links a.on { color: #1c2128; font-weight: 700; }
.more-link { display: inline-block; margin-top: .55rem; font-size: .82rem; color: #2b6cb0; font-weight: 700; }
.odds-desk {
  display: grid;
  grid-template-columns: minmax(18rem, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas: "win q e" "win t f";
  gap: .7rem;
}
.odds-panel-win { grid-area: win; }
.odds-panel-q { grid-area: q; }
.odds-panel-e { grid-area: e; }
.odds-panel-t { grid-area: t; }
.odds-panel-f { grid-area: f; }
.odds-hero { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: .5rem; }
.ledger-desk {
  display: grid;
  grid-template-columns: minmax(13rem, .72fr) minmax(0, 1.4fr);
  gap: 1rem;
  align-items: start;
}
.register-desk, .horses-desk {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(22rem, .95fr);
  gap: 1rem;
  align-items: start;
}
.reg-list { display: flex; flex-direction: column; gap: .2rem; }
.reg-row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  gap: .4rem;
  align-items: center;
  padding: .4rem .5rem;
  border-radius: 6px;
  text-decoration: none;
  border: 1px solid transparent;
}
.reg-row:hover, .reg-row.on { background: #e8f0fa; }
.reg-row .n { font-weight: 800; color: #2b6cb0; font-variant-numeric: tabular-nums; }
.reg-row .uma { display: block; font-weight: 700; }
.reg-row .run { display: block; font-size: .78rem; color: #6b7380; }
.reg-drop {
  border: 1px dashed #c5ccd6;
  border-radius: 10px;
  padding: 1.4rem 1rem;
  text-align: center;
  cursor: pointer;
  background: #f7f8fa;
}
.filters { display: flex; flex-wrap: wrap; gap: .45rem .7rem; margin: 0 0 .55rem; }
.filters label { font-size: .78rem; }
.pipe { position: sticky; top: .75rem; }
.pipe-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .65rem; margin-bottom: .45rem; }
.pipe-step { border-top: 1px solid #eef0f3; padding: .45rem 0; font-size: .85rem; }
.pipe-k { font-size: .68rem; letter-spacing: .06em; color: #6b7380; font-weight: 700; margin: 0 0 .15rem; }
.pipe-final { font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums; margin: .35rem 0 0; }
.pipe-eq { font-size: .78rem; color: #3d4550; margin: .15rem 0 0; }
.shot-thumb {
  display: block; width: 10.6rem; height: 4.15rem; overflow: hidden; padding: 0;
  border: 1px solid #d5d9e0; border-radius: 6px; background: #1a1c1f; cursor: pointer;
}
.shot-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.shot-none {
  width: 10.6rem; height: 4.15rem; border: 1px dashed #c5ccd6; border-radius: 6px;
  color: #6b7380; font-size: .72rem; display: flex; align-items: center; justify-content: center;
}
dialog.shot-dlg {
  width: min(96vw, 72rem); max-width: none; height: min(94vh, 52rem);
  border: 0; padding: 0; background: #121416;
}
dialog.shot-dlg::backdrop { background: rgba(10, 12, 16, .72); }
.shot-scroller { height: 100%; overflow: auto; }
.shot-scroller.fit img { max-height: 94vh; width: auto; max-width: 100%; }
.shot-scroller.read img { max-height: none; width: auto; }
table.plain tbody tr[data-id] { cursor: pointer; }
table.plain tbody tr.on { background: #e8f0fa; }
.mini-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: .2rem .75rem; }
.mini-row {
  display: grid; grid-template-columns: 1.5rem minmax(0, 1.15fr) minmax(0, .75fr) 3.1rem;
  gap: .3rem; align-items: baseline; padding: .22rem 0; border-bottom: 1px solid #eef0f3; font-size: .82rem;
}
.mini-row .n { font-weight: 800; font-variant-numeric: tabular-nums; color: #2b6cb0; }
.mini-row .uma, .mini-row .run { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-row .run { color: #6b7380; }
.mini-row .od { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
.work-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.bet-mini .t-row {
  display: grid; grid-template-columns: 4.2rem minmax(0, 1fr) auto;
  gap: .4rem; padding: .28rem 0; border-bottom: 1px solid #eef0f3; font-size: .82rem;
}
.split { display: grid; grid-template-columns: minmax(11.5rem, .85fr) minmax(0, 1.7fr); gap: 1rem; min-height: 18rem; }
.ranks-cols { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: .4rem .65rem; }
.col-h { font-size: .72rem; letter-spacing: .08em; font-weight: 700; color: #6b7380; margin: 0 0 .4rem; }
.stack { display: flex; flex-direction: column; gap: .4rem; }
.rank-row { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: .4rem; align-items: stretch; }
.rank-row .rk-n {
  display: flex; align-items: center; justify-content: center; font-weight: 800;
  font-variant-numeric: tabular-nums; color: #2b6cb0; background: #f4f6f9; border-radius: 6px;
}
.horse {
  display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  gap: .35rem; align-items: center; padding: .35rem .45rem;
  border: 1px solid #d5d9e0; border-radius: 6px; background: #fff; cursor: grab;
}
.horse.on { outline: 2px solid #2b6cb0; }
.horse .n { font-weight: 800; color: #2b6cb0; }
.horse .run { font-size: .75rem; color: #6b7380; }
.slot {
  min-height: 2.7rem; border: 1px dashed #c5ccd6; border-radius: 6px;
  padding: .25rem; background: #fafbfc;
}
.slot.fill { border-style: solid; background: #fff; }
.slot.drop { background: #e8f0fa; }
.escape-handle {
  position: fixed; top: 42%; right: 0; z-index: 12; writing-mode: vertical-rl;
  font-size: .78rem; font-weight: 700; letter-spacing: .12em;
  padding: .7rem .45rem; border: 1px solid #d9cbbd; border-right: 0;
  border-radius: 8px 0 0 8px; background: #efe6dc; color: #6a5344; cursor: pointer;
}
body[data-esc-open] .escape-handle { right: 16.75rem; }
.escape-scrim { display: none; position: fixed; inset: 0; z-index: 18; background: rgba(18, 22, 28, .28); }
body[data-esc-open] .escape-scrim { display: block; }
.escape-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 20; width: 16.75rem;
  background: #efe6dc; border-left: 1px solid #d9cbbd; padding: .85rem .75rem 4.5rem;
  color: #3d342c; transform: translateX(100%); transition: transform .18s ease;
}
body[data-esc-open] .escape-drawer { transform: none; }
.escape-drawer .esc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: .35rem; }
.escape-drawer .esc-top button { font: inherit; border: 0; background: none; cursor: pointer; color: #6a5344; font-size: 1.1rem; }
.esc-k { margin: 0 0 .4rem; font-size: .68rem; letter-spacing: .08em; font-weight: 700; color: #8a5a3a; }
.esc-note { margin: .35rem 0 .5rem; font-size: .72rem; color: #6b5a4e; }
.esc-grid button {
  display: block; width: 100%; text-align: left; margin: 0 0 .35rem;
  border: 1px solid #c4b4a6; background: #fff; color: inherit; padding: .4rem .55rem; border-radius: 6px; cursor: pointer;
}
.esc-grid button.danger { border-color: #d4a0a0; color: #a33; background: #fff; }
.esc-grid button:disabled { opacity: .4; cursor: not-allowed; }
@media (max-width: 900px) {
  .dash { grid-template-columns: 1fr; }
  .side { flex-direction: row; flex-wrap: wrap; }
  .side .mark { width: 100%; }
  .kpis, .ops-pair, .odds-desk, .ledger-desk, .register-desk, .horses-desk, .work-split, .split { grid-template-columns: 1fr; }
  .odds-desk { grid-template-areas: "win" "q" "e" "t" "f"; }
  .ranks-cols { grid-template-columns: 1fr; grid-auto-flow: row; }
}
`;
