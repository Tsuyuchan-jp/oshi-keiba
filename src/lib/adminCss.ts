/** 管理ダッシュ用。メンバーの和紙・明朝・LED は載せない */
export const ADMIN_CSS = `
:root {
  /* 管理画面の基礎色。画面全体の見た目調整はここから行う。 */
  --admin-canvas: #e6e8ed;
  --admin-surface: #fff;
  --admin-surface-muted: #f4f6f9;
  --admin-surface-subtle: #eef0f3;
  --admin-ink: #1c2128;
  --admin-side-bg: #1e242c;
  --admin-side-ink: #c5ccd3;
  --admin-muted: #6b7380;
  --admin-muted-light: #8b95a0;
  --admin-line: #d5d9e0;
  --admin-line-strong: #c5ccd6;
  --admin-line-subtle: #e2e6ec;
  --admin-accent: #2b6cb0;
  --admin-danger: #a33;
  --admin-control-radius: 6px;
  --admin-control-pad-block: .22rem;
  --admin-control-pad-inline: .55rem;
  --admin-control-optical-offset: .08em;
  --admin-focus-ring: rgba(43, 108, 176, .45);
  --admin-modal-max-width: 38rem;
  --admin-modal-inset: 1rem;
  --admin-modal-radius: 10px;
  --admin-modal-padding: 1.1rem 1.2rem;
  --admin-modal-backdrop: rgba(18, 22, 28, .45);
  --admin-modal-shadow: 0 12px 36px rgba(18, 22, 28, .24);
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: "IBM Plex Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: var(--admin-canvas);
  color: var(--admin-ink);
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
  background: var(--admin-side-bg);
  color: var(--admin-side-ink);
  padding: .9rem .7rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  /* メインが伸びてもナビは画面高に固定（ログアウト等が画面外へ行かない） */
  align-self: start;
  position: sticky;
  top: 0;
  height: 100dvh;
  max-height: 100dvh;
  overflow-y: auto;
}
.side .mark {
  font-size: .72rem;
  letter-spacing: .14em;
  font-weight: 700;
  color: var(--admin-muted-light);
  padding: .35rem .55rem .7rem;
}
.side .mark .app-ver {
  margin-left: .35rem;
  font-weight: 500;
  letter-spacing: .04em;
  color: var(--admin-muted);
  font-size: .65rem;
  font-variant-numeric: tabular-nums;
}
.side a {
  display: block;
  text-decoration: none;
  padding: .45rem .6rem;
  border-radius: 6px;
  color: var(--admin-side-ink);
  font-size: .88rem;
}
.side a:hover { background: #2a323c; color: var(--admin-surface); }
.side a.on { background: var(--admin-accent); color: var(--admin-surface); }
.side .side-foot { margin-top: auto; padding-top: 1rem; }
.side .side-foot a { color: #7a8490; font-size: .8rem; }
.main { min-width: 0; padding: 1rem 1.25rem 4.5rem; }
.hero, .work, .card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 10px;
}
.hero { padding: .9rem 1.05rem 1rem; margin-bottom: .85rem; }
.work, .card { padding: .85rem 1rem .95rem; margin-bottom: .75rem; }
.hero-top { display: flex; flex-wrap: wrap; align-items: baseline; gap: .55rem 1rem; }
.hero h1, .work h2, .card h1, .card h2 { margin: 0; }
.hero h1 { font-size: 1.25rem; }
.page-hero { display: flex; align-items: center; min-height: 4.15rem; }
.page-hero-top {
  display: flex; flex: 1; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: .55rem 1rem;
}
.page-hero-title, .page-hero-actions {
  display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .55rem;
}
.page-hero-title h1 { margin: 0; }
.page-hero-meta { color: var(--admin-muted); font-size: .85rem; }
.page-hero-actions { margin-left: auto; }
.page-hero-actions .hero-util { margin-left: 0; }
.work h2, .card h2 { font-size: 1.02rem; margin-bottom: .55rem; }
.kpis {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  margin-top: .7rem;
}
.kpi {
  background: var(--admin-surface-muted); border: 1px solid var(--admin-line-subtle); border-radius: 8px;
  padding: .4rem .7rem; min-width: 6.5rem;
}
.kpi .k { display: block; font-size: .68rem; color: var(--admin-muted); letter-spacing: .04em; }
.kpi .v { font-size: 1.05rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.ops-pair {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: .65rem 1.75rem;
  margin-top: .75rem;
  padding: .75rem .9rem;
  background: var(--admin-surface-muted);
  border: 1px solid var(--admin-line-subtle);
  border-radius: 8px;
}
.ops-k { font-size: .72rem; letter-spacing: .08em; color: var(--admin-muted); margin: 0 0 .3rem; }
.ops-next { margin: 0; font-size: 1.02rem; font-weight: 700; line-height: 1.45; }
.ctas { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.hero .ctas form { margin: 0; }
.hero .ctas button {
  background: var(--admin-surface); color: inherit; border: 1px solid var(--admin-line-strong);
  --btn-pad-block: .45rem; padding-inline: .8rem; border-radius: 6px; font-weight: 400;
}
.hero .ctas .danger { background: var(--admin-surface); border-color: #d4a0a0; color: var(--admin-danger); }
.hero .ctas .primary { background: var(--admin-accent); border-color: var(--admin-accent); color: var(--admin-surface); font-weight: 700; }
.work-actions {
  display: flex; flex-wrap: wrap; gap: .45rem;
  margin-top: 1rem; padding-top: .85rem; border-top: 1px solid #e6e9ee;
}
.work-actions form { margin: 0; }
.work-actions button {
  border: 1px solid var(--admin-line-strong); background: var(--admin-surface); color: inherit;
  --btn-pad-block: .5rem; padding-inline: .9rem; border-radius: 6px; cursor: pointer;
}
.work-actions .primary {
  background: #2f6f4e; border-color: #2f6f4e; color: var(--admin-surface); font-weight: 700;
}
.phase {
  display: inline-flex; align-items: center; gap: .35rem;
  background: #f3e6d4; color: #8a4b12;
  font-size: .78rem; font-weight: 700; padding: .2rem .6rem; border-radius: 999px; border: 0;
}
.phase.voting, .phase.live { background: #e4eef8; color: #1d4f8a; }
.phase.done { background: #e4eee8; color: #2f6f4e; }
.flash { background: #fff3d8; border: 1px solid #e4c98a; padding: .6rem .8rem; margin-bottom: .85rem; border-radius: 8px; }
.flash.error { background: #f8e4e0; border-color: #d9a59b; }
.admin-toast {
  position: fixed; z-index: 20; top: 1rem; right: 1rem; max-width: min(30rem, calc(100vw - 2rem));
  display: flex; align-items: center; gap: .55rem; padding: .7rem .8rem;
  background: #e7f4ec; border: 1px solid #9ac9aa; color: #245b38; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(30,45,65,.16); font-size: .85rem; font-weight: 600;
}
.admin-toast.error { background: #f8e4e0; border-color: #d9a59b; color: #8d2f25; }
.admin-toast > span:first-child { font-size: 1.05rem; font-weight: 800; }
.admin-toast button { margin-left: .35rem; padding: 0 .2rem; border: 0; background: transparent; color: inherit; font-size: 1.1rem; cursor: pointer; }
.card-head { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin: 0 0 .75rem; }
.card-head h2 { margin: 0; }
.muted, .note { color: var(--admin-muted); font-size: .85rem; line-height: 1.5; }
.row { display: flex; flex-wrap: wrap; gap: .6rem; align-items: end; }
label { display: flex; flex-direction: column; gap: .25rem; font-size: .85rem; }
input, select, button, textarea {
  padding: .4rem .5rem;
  border-radius: 6px;
  border: 1px solid var(--admin-line-strong);
}
input, select, textarea { background: var(--admin-surface); color: inherit; }
button, .btn {
  font: inherit;
  --btn-pad-block: .4rem;
  --btn-optical-offset: .08em;
  padding-block: calc(var(--btn-pad-block) + var(--btn-optical-offset)) calc(var(--btn-pad-block) - var(--btn-optical-offset));
  background: var(--admin-accent);
  color: var(--admin-surface);
  border: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1.4;
  vertical-align: middle;
}
button.secondary { background: var(--admin-muted); }
button.danger { background: var(--admin-danger); }
button.text-btn {
  background: none; color: var(--admin-accent); padding: 0; border: 0; border-radius: 0; text-decoration: underline;
}
button:disabled, button[disabled] { opacity: .45; cursor: not-allowed; }
button:focus-visible, .admin-action:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--admin-focus-ring);
}
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; padding: .45rem .4rem; border-bottom: 1px solid var(--admin-line-subtle); }
th { font-size: .78rem; color: var(--admin-muted); font-weight: 600; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.move-plus { color: #2f5d3a; font-weight: 700; }
.move-minus { color: var(--admin-danger); font-weight: 700; }
.scr { opacity: .55; text-decoration: line-through; }
.kind-set { border: 1px solid var(--admin-line); padding: .55rem .8rem .7rem; margin: .75rem 0 0; }
.kind-set legend { padding: 0 .35rem; font-size: .85rem; }
.kind-opts { display: flex; flex-wrap: wrap; gap: .45rem 1rem; margin-top: .35rem; }
.kind-opt { display: inline-flex; flex-direction: row; align-items: center; gap: .35rem; font-size: .9rem; }
.ocr-out {
  font-size: .82rem; white-space: pre-wrap; background: var(--admin-surface-muted);
  padding: .6rem .7rem; min-height: 4rem; margin: .6rem 0 0;
}
dialog.modal {
  position: fixed; z-index: 100; inset: 0; margin: auto;
  width: min(var(--admin-modal-max-width), calc(100% - var(--admin-modal-inset) - var(--admin-modal-inset)));
  height: fit-content;
  max-height: calc(100dvh - var(--admin-modal-inset) - var(--admin-modal-inset));
  overflow: auto; border: 1px solid var(--admin-line); border-radius: var(--admin-modal-radius);
  padding: var(--admin-modal-padding); background: var(--admin-surface); color: var(--admin-ink);
  box-shadow: var(--admin-modal-shadow);
}
dialog.modal::backdrop { background: var(--admin-modal-backdrop); }
dialog.modal h2 { margin-top: 0; }
.modal-title:focus { outline: 0; }
.modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: .45rem; margin-top: 1rem; }
.modal-actions--split { justify-content: space-between; }
.modal-actions form { margin: 0; }
.autofill-trap { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
form.reauth { position: relative; }
.eq, .plug { font-family: ui-monospace, "Cascadia Code", sans-serif; font-size: .9rem; line-height: 1.55; }
.story { font-size: .88rem; line-height: 1.7; margin: 0 0 .65rem; }
.story p { margin: 0 0 .55rem; }
.flow { display: flex; flex-direction: column; gap: .55rem; margin: 0 0 1rem; }
.flow-step { border-left: 3px solid var(--admin-line); padding: .5rem .75rem; background: var(--admin-surface-muted); }
.flow-k { font-size: .72rem; letter-spacing: .08em; color: var(--admin-muted); margin-bottom: .2rem; }
.flow-arrow { text-align: center; color: var(--admin-muted); font-size: .8rem; }
.terms { width: 100%; margin: .5rem 0 0; font-size: .82rem; }
details.terms-box summary { cursor: pointer; font-size: .9rem; padding: .35rem 0; }
.formula-box { overflow-x: auto; }
.tag {
  display: inline-block; font-size: .68rem; font-weight: 700;
  padding: .1rem .4rem; border-radius: 4px; background: #eef4fb; color: var(--admin-accent);
}
.tag.warn { background: #f8eee4; color: #8a4b12; }
.sort-links { font-size: .82rem; color: var(--admin-muted); }
.sort-links a { color: var(--admin-accent); text-decoration: none; }
.sort-links a.on { color: var(--admin-ink); font-weight: 700; }
.more-link { display: inline-block; margin-top: .55rem; font-size: .82rem; color: var(--admin-accent); font-weight: 700; }
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
/* オッズ：モック odds.html の箱 */
body.odds-page { overflow: hidden; }
body.odds-page .dash { height: 100dvh; min-height: 0; overflow: hidden; }
body.odds-page .main {
  display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden;
  padding: 1rem 1.25rem 2.4rem;
}
body.odds-page .hero { flex: 0 0 auto; }
body.odds-page .odds-desk {
  flex: 1 1 auto; min-height: 0; height: 100%; align-items: stretch;
  display: grid;
  grid-template-columns: minmax(22rem, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas: "win q e" "win t f";
  gap: .7rem;
}
body.odds-page .odds-desk .work {
  min-height: 0; height: 100%; display: flex; flex-direction: column;
  overflow: hidden; padding: .75rem .85rem .8rem; margin-bottom: 0;
}
.odds-void {
  flex: 0 0 auto; margin: 0 0 .35rem; padding: .22rem .45rem; border-radius: 4px;
  background: #f8eee4; color: #8a4b12; font-size: .72rem; font-weight: 700;
}
.odds-panel .work-head h2 { font-size: .95rem; }
.table-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }
.table-scroll thead th { position: sticky; top: 0; background: var(--admin-surface); z-index: 1; }
table.plain { width: 100%; border-collapse: collapse; font-size: .82rem; }
table.plain th {
  text-align: left; font-size: .68rem; letter-spacing: .06em; color: var(--admin-muted);
  border-bottom: 1px solid #dfe3e8; padding: .3rem .35rem;
}
table.plain td { padding: .32rem .35rem; border-bottom: 1px solid var(--admin-surface-subtle); }
table.plain td.num, table.plain th.num { text-align: right; font-variant-numeric: tabular-nums; }
.ledger-desk {
  display: grid;
  grid-template-columns: minmax(13rem, .72fr) minmax(0, 1.4fr);
  gap: 1rem;
  align-items: start;
}
body.ledger-page { overflow: hidden; }
body.ledger-page .dash { height: 100dvh; min-height: 0; overflow: hidden; }
body.ledger-page .main {
  display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden;
  padding: 1rem 1.25rem 2.4rem;
}
body.ledger-page .hero { flex: 0 0 auto; }
body.ledger-page .ledger-desk {
  flex: 1 1 auto; min-height: 0; height: 100%; align-items: stretch;
}
body.ledger-page .ledger-desk .work {
  min-height: 0; height: 100%; display: flex; flex-direction: column;
  overflow: hidden; margin-bottom: 0;
}
.ledger-del {
  border: 1px solid var(--admin-line-strong); background: var(--admin-surface); color: inherit;
  --btn-pad-block: .28rem; padding-inline: .55rem; border-radius: 6px; cursor: pointer; font-size: .78rem;
}
.filter-count { font-size: .78rem; color: var(--admin-muted); margin: 0 0 .35rem; flex: 0 0 auto; }
body.ledger-page .filters {
  flex: 0 0 auto; align-items: flex-end; margin: 0 0 .5rem;
}
body.ledger-page .filters label {
  font-size: .68rem; letter-spacing: .04em; color: var(--admin-muted);
}
body.ledger-page .filters select {
  min-width: 6.5rem; background: var(--admin-surface); border: 1px solid var(--admin-line-strong); padding: .28rem .4rem; color: inherit;
}
.register-desk {
  display: grid;
  grid-template-columns: minmax(15.5rem, 0.68fr) minmax(0, 1.5fr);
  gap: .7rem;
  min-height: 0;
  height: 100%;
}
.horses-desk {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(22rem, 0.95fr);
  gap: 1rem;
  align-items: start;
}
.reg-list { display: flex; flex-direction: column; gap: .2rem; }
.reg-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .35rem;
  align-items: center;
  padding: .25rem .3rem .25rem .2rem;
  border-radius: 6px;
  border: 1px solid transparent;
}
.reg-row:hover, .reg-row.on { background: #f4f7fb; }
.reg-row.on { background: #e8f0fa; }
.reg-row-link {
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  gap: .35rem .5rem;
  align-items: center;
  min-width: 0;
  padding: .25rem .25rem;
  text-decoration: none;
  color: inherit;
  border-radius: 4px;
}
.reg-row .n { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--admin-muted); }
.reg-row .who { min-width: 0; }
.reg-row .uma { display: block; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reg-row .run { display: block; font-size: .72rem; color: var(--admin-muted); }
.reg-unlist {
  font: inherit;
  font-size: .72rem;
  font-weight: 700;
  --btn-pad-block: .28rem; padding-inline: .5rem;
  border-radius: 6px;
  border: 1px solid var(--admin-line);
  background: var(--admin-surface);
  color: var(--admin-muted);
  cursor: pointer;
  white-space: nowrap;
}
.reg-unlist:hover { border-color: var(--admin-danger); color: var(--admin-danger); background: #fdf4f4; }
.admin-offscreen {
  position: fixed; left: 0; top: 0; width: 1px; height: 1px; opacity: 0; overflow: hidden; margin: 0; padding: 0; border: 0;
}
.reg-drop {
  border: 2px dashed var(--admin-line-strong);
  border-radius: 12px;
  min-height: 16rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #f7f8fa;
  padding: 1.2rem;
  flex: 1 1 auto;
  overflow: hidden;
  cursor: pointer;
}
.reg-drop:hover, .reg-drop.is-over { border-color: var(--admin-accent); background: #eef4fb; }
.reg-drop:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
.reg-drop strong { font-size: 1.05rem; }
.reg-drop p { margin: .35rem 0 0; color: var(--admin-muted); font-size: .85rem; }
.reg-alt { margin-top: .85rem; text-align: center; }
.reg-alt button {
  font: inherit; border: 0; background: none; color: var(--admin-accent); cursor: pointer; text-decoration: underline;
}
.reg-bench {
  display: grid;
  grid-template-columns: 8.2rem minmax(0, 1fr);
  gap: .9rem 1rem;
  align-items: start;
}
.reg-shot {
  width: 8.2rem; height: 12.5rem; object-fit: cover; object-position: top;
  border-radius: 8px; border: 1px solid var(--admin-line); background: #1a1c1f; display: block;
}
.reg-shot-btn { padding: 0; border: 0; background: none; cursor: pointer; border-radius: 8px; }
.reg-shot.empty {
  display: flex; align-items: center; justify-content: center;
  color: #8a929c; font-size: .75rem; background: var(--admin-surface-muted);
}
.reg-names { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
.reg-names label, .reg-score-in label {
  display: flex; flex-direction: column; gap: .2rem; font-size: .7rem; color: var(--admin-muted);
}
.reg-score-row {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: .5rem 1rem; margin-top: .85rem;
}
.reg-score-row .reg-score-in { flex: 0 1 auto; max-width: 10rem; margin-top: 0; }
.reg-score-auto {
  display: none; font-size: .78rem; color: var(--admin-muted); margin: 0 0 .38rem; flex: 0 0 auto; line-height: 1;
  align-self: center;
}
.reg-score-auto::before {
  content: "評価点 · "; font-size: .7rem; letter-spacing: .06em; color: #8a929c;
}
.reg-manual-toggle {
  display: inline-flex; align-items: center; cursor: pointer; user-select: none;
  margin: 0 0 .38rem; flex: 0 0 auto;
}
.reg-manual-pill {
  display: inline-flex; align-items: center; justify-content: center;
  box-sizing: border-box; font: inherit; font-size: .78rem; line-height: 1;
  min-height: 1.85rem; border: 1px solid var(--admin-line-strong); background: var(--admin-surface); padding: 0 .72rem;
  border-radius: 999px; color: var(--admin-muted); white-space: nowrap;
}
.reg-manual-toggle:hover .reg-manual-pill { border-color: #9aa3b0; color: #3d4550; }
.reg-manual-toggle input:focus-visible + .reg-manual-pill {
  outline: 2px solid var(--admin-accent); outline-offset: 2px;
}
.reg-manual-toggle input:checked + .reg-manual-pill {
  background: var(--admin-side-bg); border-color: var(--admin-side-bg); color: var(--admin-surface); font-weight: 700;
}
.reg-manual-toggle input:checked + .reg-manual-pill:hover {
  background: #2a313c; border-color: #2a313c;
}
.reg-names input, .reg-score-in input {
  font: inherit; font-size: 1.12rem; font-weight: 700; padding: .35rem .45rem;
  border: 0; border-bottom: 2px solid var(--admin-line-strong); border-radius: 0; background: transparent;
}
.reg-names input:focus, .reg-score-in input:focus { outline: none; border-bottom-color: var(--admin-accent); }
.reg-stats {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .35rem; margin-top: .75rem;
}
.reg-stat { background: var(--admin-surface-muted); border-radius: 6px; padding: .3rem .4rem; }
.reg-stat .k { display: block; font-size: .65rem; color: var(--admin-muted); }
.reg-stat .v { font-weight: 700; font-variant-numeric: tabular-nums; }
.reg-chips { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .55rem; align-items: center; }
.reg-chip {
  font-size: .72rem; padding: .12rem .4rem; border-radius: 999px;
  background: var(--admin-surface-subtle); border: 1px solid transparent;
}
.reg-chip.s { background: #dbe7f6; border-color: var(--admin-accent); color: #1a3a66; font-weight: 800; }
.reg-slash { color: #8a929c; font-weight: 700; padding: 0 .2rem; user-select: none; }
.reg-chip.gold { background: #f4ead0; }
.reg-chip.green { background: #dceee0; }
.reg-chip.evo { background: #f0dfe2; color: #6e343c; }
.reg-chip.white { background: var(--admin-surface-subtle); }
.reg-chip.minus { background: #f3e4e4; color: #7a3030; }
.reg-preview {
  margin-top: .85rem; padding: .65rem .75rem; background: #e8f0fa; border-radius: 8px;
  display: flex; justify-content: space-between; align-items: baseline; gap: .6rem;
}
.reg-preview .lab { font-size: .75rem; color: #3d5a80; }
.reg-preview .num { font-size: 1.45rem; font-weight: 800; font-variant-numeric: tabular-nums; }
#horse-add[data-mode="idle"] #mode-work { display: none; }
#horse-add:not([data-mode="idle"]) #mode-idle { display: none; }
#horse-add[data-mode="read"] #reg-shot-empty { display: none; }
#horse-add[data-mode="manual"] #shot-open { display: none; }
#horse-add[data-mode="read"]:not(.need-score) .reg-score-in { display: none; }
#horse-add[data-mode="read"]:not(.need-score) .reg-score-auto { display: block; }
#horse-add[data-mode="manual"] #ocr-materials { display: none; }
.reg-cue {
  margin: .55rem 0 .4rem;
  padding: .55rem .7rem;
  border: 1.5px solid var(--admin-accent);
  background: #e8f0fa;
  border-radius: 8px;
}
.reg-cue p { margin: 0; font-size: .88rem; font-weight: 700; color: #1a3a66; line-height: 1.4; }
.reg-drop.has-file {
  flex-direction: row;
  justify-content: flex-start;
  text-align: left;
  gap: .9rem;
  border-style: solid;
  border-color: var(--admin-accent);
  background: var(--admin-surface);
  min-height: 9.5rem;
}
.reg-drop-picked { display: none; align-items: center; gap: .85rem; min-width: 0; }
.reg-drop.has-file .reg-drop-idle { display: none; }
.reg-drop.has-file .reg-drop-picked { display: flex; }
.reg-drop-thumb {
  width: 5.2rem; height: 8rem; object-fit: cover; object-position: top;
  border-radius: 8px; border: 1px solid var(--admin-line); background: #1a1c1f; flex: 0 0 auto;
}
.reg-drop-picked strong { display: block; font-size: .95rem; word-break: break-all; }
.reg-drop-picked p { margin: .25rem 0 0; }
.reg-chip.skip {
  background: var(--admin-surface-muted);
  color: #8a929c;
  border: 1px dashed #b4bcc6;
  text-decoration: line-through;
}
.reg-chip.strategic {
  background: #e8eef8;
  border-color: #5a7fb8;
  color: #1a3a66;
}
.reg-chip .reg-pts {
  margin-left: .25rem;
  font-size: .78em;
  font-weight: 800;
  opacity: .85;
}
.linkish {
  font: inherit;
  border: 0;
  background: none;
  color: var(--admin-accent);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: .12em;
}
.hero-util {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .35rem .55rem;
  font-size: .78rem;
  color: var(--admin-muted);
}
.admin-action {
  display: inline-flex; align-items: center; line-height: 1.4; text-decoration: none;
  font: inherit;
  border: 1px solid var(--admin-line-strong);
  border-radius: var(--admin-control-radius);
  background: var(--admin-surface);
  color: var(--admin-accent);
  --btn-pad-block: var(--admin-control-pad-block);
  --btn-optical-offset: var(--admin-control-optical-offset);
  padding-block: calc(var(--btn-pad-block) + var(--btn-optical-offset)) calc(var(--btn-pad-block) - var(--btn-optical-offset));
  padding-inline: var(--admin-control-pad-inline);
  cursor: pointer;
}
.admin-action--primary {
  background: var(--admin-accent); border-color: var(--admin-accent);
  color: var(--admin-surface); font-weight: 700;
}
.admin-action:disabled { opacity: .55; cursor: default; }
.hero-util-sep { color: #b4bcc6; user-select: none; }
.hero-key-wrap { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .35rem .45rem; }
.hero-key-label { font-weight: 700; color: #3d4550; }
.hero-key-mask { font-family: ui-monospace, monospace; letter-spacing: .02em; }
.hero-key-wrap input {
  font: inherit;
  min-width: 10rem;
  padding: .2rem .4rem;
  border: 1px solid var(--admin-line-strong);
  border-radius: 6px;
  background: var(--admin-surface);
}
.hero-key-wrap button {
  font: inherit;
  border: 0;
  background: none;
  color: var(--admin-accent);
  cursor: pointer;
}
.strategic-dlg { max-width: 36rem; }
.strategic-table-wrap { max-height: 14rem; overflow: auto; margin-top: .35rem; }
.strategic-add-form {
  display: grid;
  grid-template-columns: 1fr 5rem 4rem;
  gap: .45rem .55rem;
  align-items: end;
  margin-top: .35rem;
}
.strategic-add-form label { font-size: .78rem; display: flex; flex-direction: column; gap: .15rem; }
.strategic-add-form label:nth-child(4) { grid-column: 1 / -1; }
.strategic-add-form label input { font: inherit; padding: .25rem .4rem; border: 1px solid var(--admin-line-strong); border-radius: 6px; }
.strategic-cand-row {
  padding: .65rem 0;
  border-bottom: 1px solid var(--admin-surface-subtle);
  font-size: .85rem;
}
.strategic-cand-row:last-child { border-bottom: 0; }
.strategic-cand-head { font-weight: 600; margin-bottom: .45rem; }
.strategic-cand-fields {
  display: grid;
  grid-template-columns: 4.5rem 1fr auto auto;
  gap: .4rem .55rem;
  align-items: end;
}
.strategic-cand-field {
  font-size: .78rem;
  display: flex;
  flex-direction: column;
  gap: .15rem;
  margin: 0;
}
.strategic-cand-field input {
  font: inherit;
  padding: .25rem .4rem;
  border: 1px solid var(--admin-line-strong);
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
}
.strategic-cand-memo-field { min-width: 0; }
.strategic-cand-fields button { align-self: end; }
@media (max-width: 520px) {
  .strategic-cand-fields {
    grid-template-columns: 1fr 1fr;
  }
  .strategic-cand-memo-field { grid-column: 1 / -1; }
  .strategic-cand-fields .strategic-cand-add { grid-column: 1; }
  .strategic-cand-fields .strategic-cand-dismiss { grid-column: 2; }
}
.reg-key { font-size: .78rem; color: var(--admin-muted); display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .5rem; }
.reg-key input {
  font: inherit; min-width: 12rem; padding: .2rem .4rem; border: 1px solid var(--admin-line-strong); border-radius: 6px; background: var(--admin-surface);
}
.reg-key button { font: inherit; border: 0; background: none; color: var(--admin-accent); cursor: pointer; }
.reg-locked { margin: 0; font-size: 1.02rem; font-weight: 700; }
.filters { display: flex; flex-wrap: wrap; gap: .45rem .7rem; margin: 0 0 .55rem; }
.filters label { font-size: .78rem; }
.pipe {
  background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 10px;
  padding: 1rem 1.1rem 1.15rem; position: sticky; top: .75rem;
}
.pipe h2 { margin: 0 0 .2rem; font-size: 1.02rem; }
.pipe-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .65rem .85rem; align-items: start; margin-bottom: .45rem; }
.pipe-head .note { margin: 0; }
.pipe-step { border-top: 1px solid var(--admin-surface-subtle); padding: .45rem 0; font-size: .85rem; }
.pipe-step:first-of-type { border-top: 0; padding-top: 0; }
.pipe-k { font-size: .68rem; letter-spacing: .06em; color: var(--admin-muted); font-weight: 700; margin: 0 0 .15rem; }
.pipe-v { font-variant-numeric: tabular-nums; }
.pipe-final { font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums; margin: .35rem 0 0; }
.pipe-eq { font-size: .78rem; color: #3d4550; margin: .15rem 0 0; font-variant-numeric: tabular-nums; word-break: break-word; }
.pipe-r-calc, .pipe-s-calc { color: #8b939e; font-size: .82em; margin-left: .35rem; font-weight: 400; }
.pipe-green { font-size: .85rem; line-height: 1.45; }
.shot-thumb {
  display: block; width: 10.6rem; height: 4.15rem; overflow: hidden; margin: 0; padding: 0;
  border: 1px solid var(--admin-line); border-radius: 6px; background: #1a1c1f; cursor: pointer; flex: 0 0 auto;
}
.shot-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.shot-none {
  width: 10.6rem; height: 4.15rem; margin: 0; padding: .35rem .45rem;
  border: 1px dashed var(--admin-line-strong); border-radius: 6px;
  color: var(--admin-muted); font-size: .72rem; display: flex; align-items: center; justify-content: center; text-align: center;
}
dialog.shot-dlg {
  width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh;
  margin: 0; padding: 0; border: 0; background: transparent;
}
dialog.shot-dlg[open] { display: block; }
dialog.shot-dlg::backdrop { background: rgba(18, 22, 28, .42); }
dialog.shot-dlg-left .shot-scroller { justify-content: flex-start; align-items: flex-start; }
dialog.shot-dlg-left .shot-scroller.fit img { max-width: none; cursor: zoom-in; }
dialog.shot-dlg-left .shot-scroller.read img { margin: 0; }
.shot-scroller {
  width: 100%; height: 100%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.shot-scroller.fit img {
  height: 100dvh; width: auto; max-width: 100vw; display: block; user-select: none; cursor: zoom-in;
}
.shot-scroller.read { display: block; overflow: auto; }
.shot-scroller.read img {
  height: auto; width: auto; max-width: none; display: block; margin: 0 auto; user-select: none; cursor: zoom-out;
}
table.plain tbody tr[data-id] { cursor: pointer; }
table.plain tbody tr[data-id]:hover { background: #f4f7fb; }
table.plain tbody tr.on { background: #e8f0fa; }
.mini-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: .2rem .75rem; }
.mini-row {
  display: grid; grid-template-columns: 1.5rem minmax(0, 1.15fr) minmax(0, .75fr) 3.1rem;
  gap: .3rem; align-items: baseline; padding: .22rem 0; border-bottom: 1px solid var(--admin-surface-subtle); font-size: .82rem;
}
.mini-row .n { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--admin-accent); }
.mini-row .uma, .mini-row .run { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-row .run { color: var(--admin-muted); }
.mini-row .od { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; }
.work-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.bet-mini .t-row {
  display: grid; grid-template-columns: 4.2rem minmax(0, 1fr) auto;
  gap: .4rem; padding: .28rem 0; border-bottom: 1px solid var(--admin-surface-subtle); font-size: .82rem;
}
.split { display: grid; grid-template-columns: minmax(11.5rem, .85fr) minmax(0, 1.7fr); gap: 1rem; min-height: 18rem; }
.ranks-cols { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: .4rem .65rem; }
/* 進行：画面高に収め、着順入力は残り高さいっぱいで枠内スクロール */
body.progress-page { overflow: hidden; }
body.progress-page .dash { height: 100dvh; min-height: 0; overflow: hidden; }
body.progress-page .main {
  display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden;
  padding: 1rem 1.25rem 1.25rem;
}
body.progress-page .hero { flex: 0 0 auto; }
body.progress-page .flash { flex: 0 0 auto; }
body.progress-page .work {
  flex: 1 1 auto; min-height: 0; margin-bottom: 0;
  display: flex; flex-direction: column; overflow: hidden;
}
body.progress-page .work > h2 { flex: 0 0 auto; }
body.progress-page .work-actions { flex: 0 0 auto; }
body.progress-page #place-board .split {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  align-content: start;
}
body.progress-page .work:not(#place-board) { overflow: auto; }
.col-h { font-size: .72rem; letter-spacing: .08em; font-weight: 700; color: var(--admin-muted); margin: 0 0 .4rem; }
.stack { display: flex; flex-direction: column; gap: .4rem; }
.rank-row { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: .4rem; align-items: stretch; }
.rank-row .rk-n {
  display: flex; align-items: center; justify-content: center; font-weight: 800;
  font-variant-numeric: tabular-nums; color: var(--admin-accent); background: var(--admin-surface-muted); border-radius: 6px;
}
.horse {
  display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  gap: .35rem; align-items: center; padding: .35rem .45rem;
  border: 1px solid var(--admin-line); border-radius: 6px; background: var(--admin-surface); cursor: grab;
}
.horse.on { outline: 2px solid var(--admin-accent); }
.horse.static { cursor: default; }
.horse .n { font-weight: 800; color: var(--admin-accent); }
.horse .run { font-size: .75rem; color: var(--admin-muted); }
.slot {
  min-height: 2.7rem; border: 1px dashed var(--admin-line-strong); border-radius: 6px;
  padding: .25rem; background: #fafbfc;
}
.slot.fill { border-style: solid; background: var(--admin-surface); }
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
  border: 1px solid #c4b4a6; background: var(--admin-surface); color: inherit; --btn-pad-block: .4rem; padding-inline: .55rem; border-radius: 6px; cursor: pointer;
}
.esc-grid button.danger { border-color: #d4a0a0; color: var(--admin-danger); background: var(--admin-surface); }
.esc-grid button:disabled { opacity: .4; cursor: not-allowed; }
/* 開催設定：モック settings.html / shared.css の箱 */
body.settings-page { overflow: hidden; }
body.settings-page .dash { height: 100dvh; min-height: 0; overflow: hidden; }
body.settings-page .main {
  display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden;
  padding: 1rem 1.25rem 2.4rem;
}
body.settings-page .hero { flex: 0 0 auto; }
body.settings-page .settings-desk { flex: 1 1 auto; min-height: 0; }
.settings-desk { display: flex; flex-direction: column; gap: .7rem; min-height: 0; height: 100%; }
.settings-top {
  display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(17rem, 0.8fr);
  gap: .7rem; flex: 0 0 auto;
}
.settings-mid { flex: 1 1 auto; min-height: 0; }
.settings-bot { flex: 0 0 auto; }
body.settings-page .settings-desk .work {
  min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: .85rem 1rem .95rem; margin-bottom: 0;
}
.settings-mid.work { height: 100%; }
.settings-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }
.settings-flash { margin: .35rem 0 0; font-size: .8rem; font-weight: 700; color: var(--admin-accent); }
.settings-flash.err { color: var(--admin-danger); }
.set-title {
  width: 100%; font: inherit; font-size: 1.45rem; font-weight: 700; letter-spacing: .01em;
  border: 0; border-bottom: 2px solid var(--admin-line-strong); border-radius: 0; padding: .15rem 0 .35rem;
  background: transparent; color: inherit;
}
.set-title:focus { outline: none; border-bottom-color: var(--admin-accent); }
.set-row {
  display: grid; grid-template-columns: minmax(12rem, 1.4fr) repeat(2, minmax(6.5rem, 0.7fr));
  gap: .75rem 1rem; margin-top: .85rem; align-items: end;
}
.set-field { display: flex; flex-direction: column; gap: .2rem; }
.set-field .k { font-size: .7rem; letter-spacing: .06em; color: var(--admin-muted); }
.set-field input, .set-course {
  font: inherit; padding: .4rem .5rem; border: 1px solid var(--admin-line-strong); border-radius: 6px; color: inherit; background: var(--admin-surface);
}
.set-field input[type="datetime-local"] { font-size: 1.02rem; }
.set-course { width: 100%; font-size: 1.08rem; font-weight: 700; padding: .5rem .6rem; }
.set-quiet input { background: #f7f8fa; font-variant-numeric: tabular-nums; }
.set-k { margin: 0 0 .4rem; font-size: .7rem; letter-spacing: .08em; color: var(--admin-muted); }
.set-seg { display: flex; flex-wrap: wrap; gap: .3rem; }
.set-seg button {
  font: inherit; border: 1px solid var(--admin-line-strong); background: var(--admin-surface); --btn-pad-block: .32rem; padding-inline: .7rem;
  border-radius: 999px; cursor: pointer; color: var(--admin-ink);
}
.set-seg button.on { background: var(--admin-side-bg); color: var(--admin-surface); border-color: var(--admin-side-bg); font-weight: 700; }
.set-togs { display: flex; flex-direction: column; gap: .4rem; }
.set-tog {
  font: inherit; text-align: left; border: 1px solid var(--admin-line-strong); background: var(--admin-surface); --btn-pad-block: .5rem; padding-inline: .7rem;
  border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: .6rem;
  color: inherit;
}
.set-tog.on { background: #e8f0fa; border-color: var(--admin-accent); font-weight: 700; }
.set-tog .st { font-size: .72rem; font-weight: 700; color: var(--admin-muted); }
.set-tog.on .st { color: var(--admin-accent); }
.set-tog:disabled, .set-togs.locked .set-tog { cursor: not-allowed; opacity: .72; }
.set-lock { margin: 0 0 .5rem; font-size: .78rem; color: #8a4b12; }
.set-conds { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem 1.1rem; margin-top: .85rem; }
.set-targets { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .45rem; margin-top: .75rem; }
.set-target { background: var(--admin-surface-muted); border: 1px solid var(--admin-line-subtle); border-radius: 8px; padding: .4rem .5rem .5rem; }
.set-target .k { display: block; font-size: .68rem; color: var(--admin-muted); margin-bottom: .2rem; }
.set-target input {
  width: 100%; font: inherit; font-size: 1.12rem; font-weight: 700; font-variant-numeric: tabular-nums;
  border: 0; background: transparent; padding: 0; color: inherit;
}
.set-target input:focus { outline: none; }
.set-flag { margin-top: 0; }
.set-flag button {
  font: inherit; border: 1px dashed var(--admin-line-strong); background: var(--admin-surface); --btn-pad-block: .4rem; padding-inline: .75rem; border-radius: 8px; cursor: pointer; color: inherit;
}
.set-flag button.on { border-style: solid; border-color: #8a4b12; background: #f8eee4; font-weight: 700; color: #8a4b12; }
.set-stamina-open { text-align: left; cursor: pointer; font: inherit; color: inherit; }
.set-stamina-open strong { display: block; font-size: 1rem; font-variant-numeric: tabular-nums; }
.stamina-modal { width: min(34rem, calc(100vw - 2rem)); }
.stamina-table input { width: 100%; min-width: 5.5rem; font: inherit; font-weight: 700; }
.set-foot { margin: .7rem 0 0; font-size: .75rem; color: var(--admin-muted); }
.set-metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .5rem; }
.set-metric { background: var(--admin-surface-muted); border: 1px solid var(--admin-line-subtle); border-radius: 8px; padding: .5rem .6rem .55rem; }
.set-metric .sym { float: right; font-size: .68rem; font-weight: 800; color: var(--admin-muted-light); letter-spacing: .04em; }
.set-metric .k { display: block; font-size: .7rem; color: var(--admin-muted); margin-bottom: .15rem; }
.set-metric input {
  width: 100%; font: inherit; font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums;
  border: 0; background: transparent; padding: .1rem 0; color: inherit;
}
.set-metric input:focus { outline: none; }
.set-metric .d { display: block; font-size: .68rem; color: #8a929c; line-height: 1.35; margin-top: .15rem; }
body.settings-page .settings-bot.work { background: #eef1f5; border-color: var(--admin-line); }
/* 出走登録：モック register.html の箱。file は overflow の外 */
body.register-page { overflow: hidden; }
body.register-page .dash { height: 100dvh; min-height: 0; overflow: hidden; }
body.register-page .main {
  display: flex; flex-direction: column; min-height: 0; height: 100%; overflow: hidden;
  padding: 1rem 1.25rem 2.4rem;
}
body.register-page .hero { flex: 0 0 auto; }
body.register-page .register-desk {
  flex: 1 1 auto; min-height: 0; height: 100%;
}
body.register-page .register-desk .work {
  min-height: 0; height: 100%; display: flex; flex-direction: column;
  overflow: hidden; margin-bottom: 0; padding: .8rem .9rem .9rem;
}
body.register-page #horse-add,
body.register-page #horse-edit {
  display: flex; flex-direction: column; min-height: 0; flex: 1 1 auto; height: 100%;
}
body.register-page #mode-idle {
  display: flex; flex-direction: column; min-height: 0; flex: 1 1 auto;
}
body.register-page .work .ctas button {
  border: 1px solid var(--admin-line-strong); background: var(--admin-surface); color: inherit; --btn-pad-block: .45rem; padding-inline: .8rem; border-radius: 6px; cursor: pointer;
}
body.register-page .work .ctas .primary { background: var(--admin-accent); border-color: var(--admin-accent); color: var(--admin-surface); font-weight: 700; }
body.register-page .work .ctas a { align-self: center; font-size: .85rem; color: var(--admin-accent); }
.work-head {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: .4rem .75rem; margin-bottom: .35rem; flex: 0 0 auto;
}
.work-head h2 { margin: 0; }
.work-head-main { min-width: 0; }
.work-head-main .odds-meta { display: block; margin-top: .12rem; }
.reg-next {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  font: inherit;
  font-weight: 700;
  font-size: .88rem;
  padding: .5rem 1rem;
  border-radius: 8px;
  background: var(--admin-accent);
  color: var(--admin-surface);
  border: 0;
  text-decoration: none;
  white-space: nowrap;
}
.reg-next:hover { background: #245d96; color: var(--admin-surface); }
.odds-meta { font-size: .72rem; color: var(--admin-muted); }
@media (max-width: 1199px) {
  body.settings-page .settings-top { grid-template-columns: 1fr; }
  .set-conds { grid-template-columns: 1fr; }
  .set-targets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .set-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  body.odds-page .odds-desk {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: minmax(14rem, 1.15fr) minmax(11rem, 1fr) minmax(11rem, 1fr);
    grid-template-areas: "win win" "q e" "t f";
  }
}
@media (max-width: 900px) {
  .dash { grid-template-columns: 1fr; }
  .side {
    flex-direction: row;
    flex-wrap: wrap;
    position: static;
    height: auto;
    max-height: none;
    align-self: stretch;
    overflow: visible;
  }
  .side .mark { width: 100%; }
  .kpis, .ops-pair, .odds-desk, .ledger-desk, .register-desk, .horses-desk, .work-split, .split { grid-template-columns: 1fr; }
  .odds-desk { grid-template-areas: "win" "q" "e" "t" "f"; }
  .ranks-cols { grid-template-columns: 1fr; grid-auto-flow: row; }
  body.settings-page { overflow: auto; }
  body.settings-page .dash { height: auto; min-height: 100dvh; }
  body.settings-page .main { height: auto; overflow: visible; }
  body.settings-page .settings-desk { display: flex; flex-direction: column; height: auto; flex: none; }
  body.settings-page .settings-desk .work { height: auto; overflow: visible; }
  body.settings-page .settings-mid { flex: none; height: auto; }
  body.settings-page .settings-scroll { overflow: visible; }
  .set-row { grid-template-columns: 1fr; }
  .set-targets, .set-metrics { grid-template-columns: 1fr 1fr; }
  body.odds-page { overflow: auto; }
  body.odds-page .dash { height: auto; min-height: 100dvh; }
  body.odds-page .main { height: auto; overflow: visible; }
  body.odds-page .odds-desk {
    display: flex; flex-direction: column; height: auto; flex: none;
  }
  body.odds-page .odds-desk .work { height: min(52vh, 20rem); }
  body.ledger-page { overflow: auto; }
  body.ledger-page .dash { height: auto; min-height: 100dvh; }
  body.ledger-page .main { height: auto; overflow: visible; }
  body.ledger-page .ledger-desk { flex: none; }
  body.ledger-page .ledger-desk .work { height: min(70vh, 28rem); }
  body.register-page { overflow: auto; }
  body.register-page .dash { height: auto; min-height: 100dvh; }
  body.register-page .main { height: auto; overflow: visible; }
  body.register-page .register-desk { display: flex; flex-direction: column; height: auto; flex: none; }
  body.register-page .register-desk .work { height: min(70vh, 28rem); }
  body.progress-page { overflow: auto; }
  body.progress-page .dash { height: auto; min-height: 100dvh; }
  body.progress-page .main { height: auto; overflow: visible; padding-bottom: 4.5rem; }
  body.progress-page .work { flex: none; height: auto; overflow: visible; }
  body.progress-page #place-board .split { flex: none; max-height: min(70vh, 28rem); overflow: auto; }
  .reg-bench { grid-template-columns: 1fr; }
  .pipe { position: static; }
}
`;
