import { escapeHtml } from "./http";
import {
  BET_KIND_BLURB,
  BET_KIND_LABEL,
  formatSelectionLabel,
  OPTIONAL_BET_KINDS,
  parseEnabledKinds,
  type BetKind,
} from "./bets";
import type {
  BetRow,
  Board,
  EventRow,
  EventStatus,
  HorseBoard,
  UserRow,
} from "./store";
import { eventScoreSetup, numberByHorseId } from "./store";
import { horseSheetParts } from "./horseName";
import { IMPUTED_LAMBDA } from "./odds";
import {
  DEFAULT_SCORE_REQ,
  GROUND_CONDITION_OPTIONS,
  listScoreCourses,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from "./scoreSetup";

export function formatOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

export function formatOddsWithUnit(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}倍`;
}

export function formatPt(n: number): string {
  return `${n.toLocaleString("ja-JP")} スペ`;
}

/** メンバー目線の収支。増えたら＋、減ったら−。未確定は空 */
export function formatMove(n: number | null): string {
  if (n == null) return "";
  const abs = Math.abs(n).toLocaleString("ja-JP");
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return "0";
}

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case "setup":
      return "出走登録中";
    case "voting":
      return "投票中";
    case "closed":
      return "投票締切（確定配当）";
    case "published":
      return "結果公開";
  }
}

export function headerPhaseKind(status: EventStatus): "setup" | "voting" | "done" {
  if (status === "setup") return "setup";
  if (status === "voting") return "voting";
  return "done";
}

export function toJstInput(ms: number | null): string {
  if (ms == null) return "";
  const jst = new Date(ms + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 16);
}

export function parseJstInput(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 9 * 60 * 60 * 1000;
}

const CSS = `
:root {
  --bg: #f4efe4;
  --ink: #1c2416;
  --muted: #5c6754;
  --paper: #fffaf1;
  --line: #d7ccb6;
  --accent: #2f5d3a;
  --stamp: #c45c2c;
  --danger: #8b1e1e;
  --ok: #2f5d3a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif;
  background:
    radial-gradient(circle at 10% 0%, #efe6d4 0, transparent 40%),
    var(--bg);
  color: var(--ink);
}
header.app {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}
header.app a { color: var(--accent); }
header.app a.brand {
  color: inherit;
  text-decoration: none;
}
header.app .head-left { min-width: 0; }
header.app .who { margin-top: .35rem; }
@media (max-width: 640px) {
  header.app {
    flex-direction: column;
    align-items: stretch;
    gap: .7rem;
    padding: .8rem 1rem;
  }
  .app-ver { display: none; }
  nav.links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .45rem;
    width: 100%;
  }
  nav.links a,
  nav.links button.text-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.7rem;
    padding: .45rem .5rem;
    background: #f7f3ea;
    border: 1px solid var(--line);
    border-radius: 8px;
    text-decoration: none;
    text-underline-offset: 0;
    font-size: .92rem;
    font-weight: 600;
    width: auto;
    max-width: 100%;
    box-sizing: border-box;
  }
}
.app-ver {
  margin-left: .45rem;
  font-weight: 600;
  letter-spacing: .04em;
  color: inherit;
  vertical-align: baseline;
}
.stamp {
  display: inline-block;
  margin-left: .4rem;
  padding: .05rem .4rem;
  border: 2px solid var(--stamp);
  color: var(--stamp);
  font-size: .75rem;
  letter-spacing: .2em;
  transform: rotate(-6deg);
  font-family: sans-serif;
  font-weight: 700;
}
.phase {
  display: inline-block;
  margin-top: .45rem;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .95rem;
  font-weight: 700;
  letter-spacing: .04em;
  padding: .28rem .7rem;
  border-radius: 8px;
  border: 1px solid var(--line);
}
.phase.setup { background: #efe6d4; color: var(--ink); }
.phase.voting { background: #e4f0e6; color: var(--accent); border-color: var(--accent); }
.phase.done { background: #f8eee8; color: var(--stamp); border-color: var(--stamp); }
.live-mark {
  display: inline-block;
  margin-left: .5rem;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .72rem;
  letter-spacing: .08em;
  color: var(--accent);
  vertical-align: middle;
}
main { max-width: 920px; margin: 0 auto; padding: 1.25rem; }
.card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1rem 1.1rem;
  margin: 0 0 1rem;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  margin: 0 0 .75rem;
}
.card-head h2 { margin: 0; }
.move-plus { color: var(--ok); font-weight: 700; }
.move-minus { color: var(--danger); font-weight: 700; }
h1, h2 { font-weight: 600; letter-spacing: .04em; }
h1 { font-size: 1.35rem; margin: 0 0 .4rem; }
h2 { font-size: 1.05rem; margin: 0 0 .75rem; }
.muted { color: var(--muted); font-size: .92rem; }
.row { display: flex; flex-wrap: wrap; gap: .6rem; align-items: end; }
.kind-set {
  border: 1px solid var(--line);
  padding: .55rem .8rem .7rem;
  margin: .75rem 0 0;
}
.kind-set legend { padding: 0 .35rem; font-size: .85rem; }
.kind-opts { display: flex; flex-wrap: wrap; gap: .45rem 1rem; margin-top: .35rem; }
.kind-opt { display: inline-flex; flex-direction: row; align-items: center; gap: .35rem; font-size: .9rem; }
label { display: flex; flex-direction: column; gap: .25rem; font-size: .85rem; }
input, select, button, textarea {
  font: inherit;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  padding: .4rem .5rem;
}
button, .btn {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
button.secondary { background: #6b6356; }
button.danger { background: var(--danger); }
button.amt { min-width: 4.5rem; }
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; padding: .45rem .4rem; border-bottom: 1px solid var(--line); }
th { font-size: .78rem; color: var(--muted); font-weight: 600; font-family: "Hiragino Sans", "Yu Gothic", sans-serif; }
.num { text-align: right; font-variant-numeric: tabular-nums; font-family: "Hiragino Sans", "Yu Gothic", sans-serif; }
.flash { background: #fff3d8; border: 1px solid #e4c98a; padding: .6rem .8rem; margin-bottom: 1rem; }
.error { background: #f8e4e0; border-color: #d9a59b; }
nav.links { display: flex; gap: .8rem; flex-wrap: wrap; font-family: sans-serif; font-size: .85rem; }
.note { font-size: .85rem; color: var(--muted); line-height: 1.5; }
.scr { opacity: .55; text-decoration: line-through; }
.eq, .plug {
  font-family: ui-monospace, "Cascadia Code", "Yu Gothic", "Hiragino Sans", sans-serif;
  font-size: .9rem;
  line-height: 1.55;
}
.story {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .88rem;
  line-height: 1.7;
  margin: 0 0 .65rem;
}
.story p { margin: 0 0 .55rem; }
.flow { display: flex; flex-direction: column; gap: .55rem; font-family: "Hiragino Sans", "Yu Gothic", sans-serif; margin: 0 0 1rem; }
.flow-step {
  border-left: 3px solid var(--line);
  padding: .5rem .75rem;
  background: #f7f3ea;
}
.flow-k { font-size: .72rem; letter-spacing: .08em; color: var(--muted); margin-bottom: .2rem; }
.flow-arrow { text-align: center; color: var(--muted); font-size: .8rem; line-height: 1; }
.terms { width: 100%; margin: .5rem 0 0; font-size: .82rem; }
.terms th { white-space: nowrap; }
details.terms-box { margin: 0 0 1rem; }
details.terms-box summary {
  cursor: pointer;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .9rem;
  padding: .35rem 0;
}
@keyframes pulse-row {
  0% { background: #ffe08a; }
  100% { background: transparent; }
}
tr.pulse-row { animation: pulse-row 1.4s ease-out; }
tr.pulse-hit { animation: pulse-row 1.4s ease-out; background: #fff3c4; }
.odds-cell { white-space: nowrap; font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-variant-numeric: tabular-nums; }
.odds-delta {
  display: inline-block;
  margin-left: .35rem;
  font-size: .78rem;
  font-weight: 700;
  transition: opacity .6s ease;
}
.odds-delta.down { color: var(--ok); }
.odds-delta.up { color: var(--stamp); }
.odds-delta.gone { opacity: 0; }
button.text-btn {
  background: none;
  color: var(--accent);
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  text-decoration: underline;
}
.ocr-out {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .82rem;
  white-space: pre-wrap;
  background: #f7f3ea;
  padding: .6rem .7rem;
  min-height: 4rem;
  margin: .6rem 0 0;
}
dialog.modal {
  max-width: 38rem;
  width: calc(100% - 2rem);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
  background: var(--paper);
  color: var(--ink);
}
dialog.modal::backdrop { background: rgba(28, 36, 22, .45); }
dialog.modal h2 { margin-top: 0; }
.howto-sec { margin: 0 0 1.05rem; }
.howto-sec h3 {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .88rem;
  font-weight: 700;
  letter-spacing: .06em;
  margin: 0 0 .35rem;
  color: var(--accent);
}
.howto-sec p { margin: 0; font-size: .9rem; line-height: 1.7; }
details.fold-card { margin: 0; }
details.fold-card > summary {
  cursor: pointer;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: .04em;
  padding: .15rem 0 .35rem;
  list-style: none;
}
details.fold-card > summary::-webkit-details-marker { display: none; }
details.fold-card > summary::after {
  content: "開く";
  float: right;
  font-size: .78rem;
  font-weight: 600;
  color: var(--muted);
}
details.fold-card[open] > summary::after { content: "閉じる"; }
.formula-box { overflow-x: auto; }
.ops-monitor {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) 2fr;
  gap: .85rem 1.25rem;
  padding: .85rem 1rem;
  background: #f7f3ea;
  border: 1px solid var(--line);
  border-radius: 8px;
  margin: 0 0 1.1rem;
}
@media (max-width: 640px) {
  .ops-monitor { grid-template-columns: 1fr; }
}
.ops-k {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .72rem;
  letter-spacing: .08em;
  color: var(--muted);
  margin: 0 0 .3rem;
}
.ops-next {
  margin: 0;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.45;
}
.ops-phase-btns { margin: 0 0 .35rem; }
.ops-aside {
  margin-top: 1.35rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--line);
}
.ops-aside h3 {
  font-size: .82rem;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  letter-spacing: .06em;
  color: var(--muted);
  margin: 0 0 .55rem;
  font-weight: 700;
}
button:disabled, button[disabled] {
  opacity: .45;
  cursor: not-allowed;
}
.autofill-trap {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
form.reauth { position: relative; }
/* 単勝表（場内・投票） */
table.win-sheet { table-layout: fixed; }
table.win-sheet th:nth-child(1),
table.win-sheet td:nth-child(1) { width: 2.4rem; }
table.win-sheet th:nth-child(4),
table.win-sheet td:nth-child(4) { width: 4.2rem; }
table.win-sheet td.name,
table.win-sheet td.runner {
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
table.win-sheet td.num-col {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
table.win-sheet th, table.win-sheet td { padding: .28rem .3rem; }
/* 賭式タブ */
.bet-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  margin: 0 0 1rem;
  -webkit-overflow-scrolling: touch;
}
.bet-tabs a {
  flex: 0 0 auto;
  padding: .55rem .85rem;
  text-decoration: none;
  color: var(--muted);
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .9rem;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.bet-tabs a.on {
  color: var(--ink);
  font-weight: 700;
  border-bottom-color: var(--accent);
}
.bet-blurb {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .9rem;
  line-height: 1.55;
  color: var(--muted);
  margin: 0 0 1rem;
  padding: .55rem .7rem;
  background: #f7f3ea;
  border-left: 3px solid var(--line);
}
.bet-form { margin: 0 0 1.25rem; }
.bet-form .row { margin-bottom: .55rem; }
.combo-list { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-size: .88rem; }
.combo-list td.num { width: 4.5rem; }
.my-bets { margin-top: 1.25rem; }
.redo-wrap { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.kind-status { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-size: .88rem; margin: .35rem 0; }
.cta { margin: 1rem 0; }
.cta a.btn { padding: .55rem 1.1rem; font-size: 1rem; }
.bal-now {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  margin: 0 0 1rem;
  padding: .65rem .85rem;
  background: #e4f0e6;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 1.02rem;
}
.bal-now .bal-k {
  display: block;
  font-size: .72rem;
  letter-spacing: .08em;
  color: var(--muted);
  margin-bottom: .15rem;
}
.bal-now strong {
  font-size: 1.45rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
}
`;

const APP_VERSION = "0.4-trial";

export function howToModal(): string {
  return `<dialog class="modal" id="howto-modal">
    <h2>使い方</h2>
    <section class="howto-sec">
      <h3>スペ</h3>
      <p>仮想のポイント「スペ」で馬券を買います。開催の投票が始まったあと、「参加する」でその回のスペが入ります。買う単位は 100 スペです。前回からの残りは持ち越されます。</p>
    </section>
    <section class="howto-sec">
      <h3>場内と投票</h3>
      <p>場内では出走表と単勝のオッズを見ます。馬券を買うときは「馬券を買う」から窓口へ進んでください。まだ参加していないときは、窓口で開催への参加だけ出ます。投票が始まる前は、場内でお待ちください。</p>
    </section>
    <section class="howto-sec">
      <h3>番号</h3>
      <p>表の番号は、このアプリの通し番号です。ゲームの枠番ではありません。買うときはこの番号を選びます。</p>
    </section>
    <section class="howto-sec">
      <h3>オッズ</h3>
      <p>オッズは投票中も動きます。締切のあと、実際に買われた票だけで払いが決まります。単勝の投票中は目安が乗っています。馬連・馬単・3連複・3連単は、その組み合わせに実際の投票があるときだけ数字が出ます。無いときは「—」です。</p>
    </section>
    <section class="howto-sec">
      <h3>買い方</h3>
      <p>賭式はタブで切り替えます。一度に買えるのは 1 点です。同じウマ娘を、同じ買い目の中で二度は選べません。買う前に確認が出ます。締切までは、やりなおしで自分の馬券を全部取り消せます。残高に戻ります。</p>
    </section>
    <section class="howto-sec">
      <h3>特払い</h3>
      <p>人数が少ないと、3連単などは当たりの組み合わせに投票が1件もないことがあります。そのときは『特払い』になり、その賭式に使ったスペの8割が戻ります。</p>
    </section>
    <section class="howto-sec">
      <h3>取消と結果</h3>
      <p>出走取消になったウマ娘を含む馬券は、全額が戻ります。結果と着順は、公開されてから出ます。他人が何を買ったかは見えません。</p>
    </section>
    <form method="dialog"><button type="submit">閉じる</button></form>
  </dialog>`;
}

export function layout(opts: {
  title: string;
  user?: UserRow | null;
  body: string;
  admin?: boolean;
  eventStatus?: EventStatus;
  live?: boolean;
  scripts?: string;
}): string {
  const whoLine = opts.user
    ? `<div class="muted who">${escapeHtml(opts.user.display_name)}　${formatPt(opts.user.balance)}</div>`
    : "";
  const logoutLink = opts.user ? `<a href="/logout">ログアウト</a>` : "";
  const howto = `<a href="#" id="howto-open">使い方</a>`;
  const liveMark = opts.live ? `<span class="live-mark" id="live-mark">ライブ</span>` : "";
  const phase = opts.eventStatus
    ? `<div class="phase ${headerPhaseKind(opts.eventStatus)}">${escapeHtml(statusLabel(opts.eventStatus))}${liveMark}</div>`
    : "";
  const memberNav = opts.admin
    ? ""
    : opts.user
      ? `<a href="/">場内</a><a href="/bet">投票</a>`
      : `<a href="/login">入室</a>`;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="app">
    <div class="head-left">
      <strong><a class="brand" href="/">oshi-keiba</a></strong><span class="stamp">試</span><span class="app-ver">v${escapeHtml(APP_VERSION)}</span>
      ${phase}
      ${whoLine}
    </div>
    <nav class="links">
      ${memberNav}
      ${howto}
      ${logoutLink}
      <a href="/admin">${opts.admin ? "管理" : "管理者"}</a>
    </nav>
  </header>
  <main>${opts.body}</main>
  ${howToModal()}
  <script>
    const howtoDlg = document.getElementById("howto-modal");
    const howtoBtn = document.getElementById("howto-open");
    if (howtoDlg && howtoBtn) {
      howtoBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        howtoDlg.showModal();
      });
    }
    if (howtoDlg) {
      howtoDlg.addEventListener("click", (ev) => {
        const r = howtoDlg.getBoundingClientRect();
        const inside =
          ev.clientX >= r.left && ev.clientX <= r.right &&
          ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside) howtoDlg.close();
      });
    }
  </script>
  ${opts.scripts ?? ""}
</body>
</html>`;
}

export function flashHtml(msg: string | null, isError = false): string {
  if (!msg) return "";
  return `<div class="flash${isError ? " error" : ""}">${escapeHtml(msg)}</div>`;
}

/** 場内・投票用の単勝表（番号・ウマ娘名・出走者・オッズ） */
export function winSheetTable(board: Board): string {
  const votingLike =
    board.event.status === "voting" || board.event.status === "setup";
  const rows = board.horses
    .filter((h) => !h.horse.scratched)
    .map((h) => {
      const odds = votingLike ? h.referenceOdds : h.confirmedOdds;
      const parts = horseSheetParts(h.horse);
      return `<tr data-horse-id="${escapeHtml(h.horse.id)}" data-sel="${escapeHtml(h.horse.id)}">
        <td class="num-col">${h.number}</td>
        <td class="name" title="${escapeHtml(parts.umaName)}">${escapeHtml(parts.umaName)}</td>
        <td class="runner" title="${escapeHtml(parts.runnerName)}">${escapeHtml(parts.runnerName)}</td>
        <td class="num odds-cell"><span class="odds-now">${formatOdds(odds)}</span><span class="odds-delta" hidden></span></td>
      </tr>`;
    })
    .join("");
  return `<table class="win-sheet">
    <thead><tr><th>番号</th><th>ウマ娘名</th><th>出走者</th><th>オッズ</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/** 連勝の実票一覧（空は —） */
export function comboOddsTable(board: Board, kind: BetKind): string {
  if (kind === "win") return winSheetTable(board);
  const pool = board.pools.find((p) => p.kind === kind);
  const nums = numberByHorseId(board);
  if (!pool || pool.combos.length === 0) {
    return `<p class="note">—</p>`;
  }
  const rows = pool.combos
    .map((c) => {
      const label = formatSelectionLabel(
        kind,
        c.horse_1,
        c.horse_2,
        c.horse_3,
        nums,
      );
      return `<tr data-sel="${escapeHtml(c.selection_key)}">
        <td>${escapeHtml(label)}</td>
        <td class="num odds-cell"><span class="odds-now">${formatOdds(c.odds)}</span><span class="odds-delta" hidden></span></td>
      </tr>`;
    })
    .join("");
  return `<table class="combo-list">
    <thead><tr><th>組み合わせ</th><th>オッズ</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function kindVoidNotes(board: Board): string {
  if (board.event.status !== "closed" && board.event.status !== "published") {
    return "";
  }
  const enabled = new Set(parseEnabledKinds(board.event.enabled_kinds));
  const lines = board.pools
    .filter((p) => enabled.has(p.kind))
    .map((p) => {
      if (p.voidSpecial == null) return "";
      const label = BET_KIND_LABEL[p.kind];
      if (p.voidSpecial) {
        if (board.event.status === "closed") {
          return `<p class="kind-status">${escapeHtml(label)}は特払い予定です。この賭式に使ったスペの8割が戻ります。</p>`;
        }
        return `<p class="kind-status">${escapeHtml(label)}は当たりの組み合わせに投票がなかったため、特払いです。この賭式に使ったスペの8割が戻ります。</p>`;
      }
      if (board.event.status === "closed") {
        return `<p class="kind-status">${escapeHtml(label)}は成立予定です。</p>`;
      }
      return "";
    })
    .filter(Boolean)
    .join("");
  return lines;
}

export function horseOptions(board: Board, name: string, excludeIds: string[] = []): string {
  const excl = new Set(excludeIds);
  return board.horses
    .filter((h) => !h.horse.scratched && !excl.has(h.horse.id))
    .map((h) => {
      const p = horseSheetParts(h.horse);
      return `<option value="${escapeHtml(h.horse.id)}">${h.number}. ${escapeHtml(p.umaName)}（${escapeHtml(p.runnerName)}）</option>`;
    })
    .join("");
}

export function groupMyBets(
  bets: BetRow[],
  board: Board,
): { kind: BetKind; label: string; amount: number; selection_key: string }[] {
  const nums = numberByHorseId(board);
  const map = new Map<
    string,
    { kind: BetKind; label: string; amount: number; selection_key: string }
  >();
  for (const b of bets) {
    if (b.refunded) continue;
    const key = `${b.kind}:${b.selection_key}`;
    const label = formatSelectionLabel(
      b.kind,
      b.horse_1,
      b.horse_2,
      b.horse_3,
      nums,
    );
    const cur = map.get(key);
    if (cur) cur.amount += b.amount;
    else
      map.set(key, {
        kind: b.kind,
        label: `${BET_KIND_LABEL[b.kind]} ${label}`,
        amount: b.amount,
        selection_key: b.selection_key,
      });
  }
  return [...map.values()];
}

/** 画面に出している単勝倍率 */
export function shownOdds(board: Board, horseId: string): number | null {
  const h = board.horses.find((x) => x.horse.id === horseId);
  if (!h || h.horse.scratched) return null;
  if (board.event.status === "voting" || board.event.status === "setup") {
    return h.referenceOdds;
  }
  return h.confirmedOdds;
}

export const BOARD_FLASH_SCRIPT = `<script>
(() => {
  const p = new URLSearchParams(location.search);
  const raw = p.get("b");
  if (!raw) return;
  let data;
  try { data = JSON.parse(decodeURIComponent(raw)); } catch {
    try { data = JSON.parse(raw); } catch { return; }
  }
  const hit = data.hit;
  for (const tr of document.querySelectorAll("tr[data-sel], tr[data-horse-id], .t-row[data-sel], .orow[data-sel]")) {
    const id = tr.getAttribute("data-sel") || tr.getAttribute("data-horse-id");
    if (id === hit) tr.classList.add("pulse-hit");
  }
  p.delete("b");
  const q = p.toString();
  history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  setTimeout(() => {
    document.querySelectorAll(".pulse-hit").forEach((el) => el.classList.remove("pulse-hit"));
  }, 2800);
})();
</script>`;

/** 投票中のみ。5秒。裏なら止める。差 0.1 以上で黄パルス */
export function livePollScript(apiPath: string, kind: BetKind): string {
  return `<script>
(() => {
  const kind = ${JSON.stringify(kind)};
  const parseShown = (t) => {
    const s = (t || "").trim();
    if (!s || s === "—") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const rowSel = "tbody tr[data-sel], tbody tr[data-horse-id], .sheet-row[data-sel], .sheet-row[data-horse-id], .chip[data-sel], .chip[data-horse-id], .orow[data-sel]";
  const seedFromDom = () => {
    const m = new Map();
    for (const tr of document.querySelectorAll(rowSel)) {
      const key = tr.getAttribute("data-sel") || tr.getAttribute("data-horse-id");
      const cell = tr.querySelector(".odds-now");
      if (!cell || !key) continue;
      m.set(key, parseShown(cell.textContent));
    }
    return m;
  };
  let prev = seedFromDom();
  let timer = null;
  const apply = (payload) => {
    const next = new Map();
    const items = payload.kinds?.[kind] || [];
    for (const it of items) next.set(it.key, it.odds);
    for (const tr of document.querySelectorAll(rowSel)) {
      const key = tr.getAttribute("data-sel") || tr.getAttribute("data-horse-id");
      const cell = tr.querySelector(".odds-now");
      if (!cell || !key) continue;
      const odds = next.get(key);
      const text = (odds == null || !Number.isFinite(odds)) ? "—" : Number(odds).toFixed(1);
      const old = prev.has(key) ? prev.get(key) : parseShown(cell.textContent);
      cell.textContent = text;
      if (old != null && odds != null && Math.abs(odds - old) >= 0.1) {
        tr.classList.add("pulse-row");
      }
    }
    // 連勝: 消えた行は静かに外す。新規行だけパルス（初回シード済みのときは新規のみ）
    if (kind !== "win") {
      const tbody = document.querySelector(".combo-list tbody");
      if (tbody) {
        const existing = new Set([...tbody.querySelectorAll("tr")].map((tr) => tr.getAttribute("data-sel")));
        for (const key of existing) {
          if (key && !next.has(key)) {
            const tr = tbody.querySelector('tr[data-sel="' + CSS.escape(key) + '"]');
            if (tr) tr.remove();
          }
        }
        for (const it of items) {
          if (existing.has(it.key)) continue;
          const tr = document.createElement("tr");
          tr.setAttribute("data-sel", it.key);
          tr.classList.add("pulse-row");
          tr.innerHTML = '<td></td><td class="num odds-cell"><span class="odds-now"></span><span class="odds-delta" hidden></span></td>';
          tr.children[0].textContent = it.label;
          tr.querySelector(".odds-now").textContent =
            (it.odds == null || !Number.isFinite(it.odds)) ? "—" : Number(it.odds).toFixed(1);
          tbody.appendChild(tr);
        }
      }
      const mini = document.querySelector(".odds-mini.combo-list");
      if (mini) {
        const existing = new Set([...mini.querySelectorAll(".orow")].map((el) => el.getAttribute("data-sel")));
        for (const key of existing) {
          if (key && !next.has(key)) {
            const el = mini.querySelector('.orow[data-sel="' + CSS.escape(key) + '"]');
            if (el) el.remove();
          }
        }
        for (const it of items) {
          if (existing.has(it.key)) continue;
          const row = document.createElement("div");
          row.className = "orow pulse-row";
          row.setAttribute("data-sel", it.key);
          const lab = document.createElement("span");
          lab.textContent = it.label;
          const od = document.createElement("span");
          od.className = "odds-now";
          od.textContent =
            (it.odds == null || !Number.isFinite(it.odds)) ? "—" : Number(it.odds).toFixed(1);
          row.append(lab, od);
          mini.appendChild(row);
        }
      }
    }
    prev = next;
    setTimeout(() => {
      document.querySelectorAll(".pulse-row").forEach((el) => el.classList.remove("pulse-row"));
    }, 1400);
  };
  const tick = async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(${JSON.stringify(apiPath)});
      if (!res.ok) return;
      const data = await res.json();
      if (data.status !== "voting") {
        if (timer) clearInterval(timer);
        const mark = document.getElementById("live-mark");
        if (mark) mark.remove();
        return;
      }
      apply(data);
    } catch (_) {}
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    prev = seedFromDom();
    tick();
  });
  tick();
  timer = setInterval(tick, 5000);
})();
</script>`;
}

export function wCaption(board: Board): string {
  return `w=${board.w.toFixed(2)}（時間 ${board.wTime.toFixed(2)} × 票量 ${board.wVolume.toFixed(2)}）　TV=${formatPt(board.tv)}（単勝 ${formatPt(board.realTotal)} ＋ λ×連勝 ${formatPt(board.exoticTotal)}）　λ=${IMPUTED_LAMBDA}　S=${board.event.seed_pool_s}　E=${board.event.pull_e}　D=${Math.round(board.event.takeout_d * 100)}%`;
}

/** 管理の週次: いまのフェーズと次に押すもの */
export function adminOpsGuide(board: Board): { now: string; next: string } {
  const now = statusLabel(board.event.status);
  const live = board.horses.filter((h) => !h.horse.scratched);
  if (board.event.status === "setup") {
    if (live.length < 2) {
      return { now, next: "出走を 2 頭以上登録してください（出走登録タブ）" };
    }
    return { now, next: "締切日時を確認してから「投票開始」" };
  }
  if (board.event.status === "voting") {
    const t = toJstInput(board.event.voting_closes_at);
    const when = t ? `日時締切は ${t.replace("T", " ")} JST。` : "日時締切は未設定。";
    return { now, next: `${when}ゲーム内で着順が見える前に「強制締切」` };
  }
  if (board.event.status === "closed") {
    if (live.some((h) => h.horse.finish_place == null)) {
      return { now, next: "進行の着順をすべて入れ、「着順を保存」" };
    }
    return { now, next: "着順を確認し、進行の「結果を公開して払戻する」" };
  }
  if (board.event.status === "published") {
    return { now, next: "「次の開催を開く」。誤って開いたら出走登録中に破棄できる" };
  }
  return { now, next: "結果公開済みです。次のレースは「次の開催を開く」" };
}

/** 管理画面: 定義 → 物語 → 式 */
export function formulaPanel(board: Board): string {
  return `<div class="formula-box">
    <p class="note">いま: ${escapeHtml(wCaption(board))}</p>
    <details class="terms-box">
      <summary>定義表（参考）</summary>
      <table class="terms">
      <thead>
        <tr><th>記号</th><th>画面で言うこと</th><th>何の数字か</th></tr>
      </thead>
      <tbody>
        <tr><td>残高</td><td>仮想のユーザー所持額</td><td>今持っているスペ</td></tr>
        <tr><td>G</td><td>毎週配る仮想ポイント</td><td>その開催に参加した人へ1回。口座に足す。オッズの式には入らない。G を変えても S と E は動かない</td></tr>
        <tr><td>単位</td><td>投票の刻み</td><td>一度に賭けられる最小のスペ</td></tr>
        <tr><td>評価点</td><td>相対評価点</td><td>単勝 Seed の比。連勝には載せない。メンバーには出さない</td></tr>
        <tr><td>Seed</td><td>単勝の仮想初期投票額</td><td>投票中の参考だけ。確定には入れない</td></tr>
        <tr><td>S</td><td>仮想の初期投票額の合計</td><td>単勝参考用。連勝には配らない</td></tr>
        <tr><td>Real</td><td>単勝の実際の投票額</td><td>確定の単勝はこの額だけ</td></tr>
        <tr><td>Imputed</td><td>連勝から単勝参考へ割り振った額</td><td>確定には入れない。λ=${IMPUTED_LAMBDA}</td></tr>
        <tr><td>TV</td><td>単勝参考の寄せに使う実票相当</td><td>単勝実票合計 ＋ λ × 連勝実票合計</td></tr>
        <tr><td>w</td><td>初期投票額をどれだけ残すか</td><td>単勝参考のみ。1 に近いほど仮想が残る</td></tr>
        <tr><td>D</td><td>控除</td><td>特払いも同じ（100→80、切り捨て）</td></tr>
      </tbody>
    </table>
    </details>
    <div class="flow">
    <div class="flow-step">
      <div class="flow-k">払いの約束①</div>
      <div class="story"><p>確定配当は実票だけの山分け。Seed と Imputed は単勝の投票中参考にだけ混ぜる。不成立は特払い B（その賭式の8割戻し）。出走取消は全額返還。連勝は実票が無ければ「—」。</p></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">1　単勝の仮想初期投票額</div>
      <div class="eq">Seed<sub>i</sub> = S × Strength<sub>i</sub> / Σ Strength</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">2　参考オッズの寄せ（単勝のみ。w）</div>
      <div class="eq">TV = 単勝実票合計 + λ × 連勝実票合計</div>
      <div class="eq">w<sub>時</sub> = 下限 + (1 − 下限) × 残り<sup>指数</sup></div>
      <div class="eq">w<sub>票</sub> = max(0, 1 − TV / E)</div>
      <div class="eq">w = w<sub>時</sub> × w<sub>票</sub></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">3　単勝の参考オッズ（投票中。確定ではない）</div>
      <div class="eq">Display<sub>i</sub> = Seed<sub>i</sub> × w + 単勝Real<sub>i</sub> + Imputed<sub>i</sub></div>
      <div class="eq">参考オッズ<sub>i</sub> = (Σ Display × (1 − D)) / Display<sub>i</sub></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">4　確定配当（賭式ごと。実票のみ）</div>
      <div class="eq">払戻しの原資 = その賭式の実票合計 × (1 − D)</div>
      <div class="eq">確定配当 = 払戻しの原資 / 当選の実票</div>
      <div class="eq">払戻 = ⌊ 賭け額 × 確定配当 ⌋</div>
      <div class="eq">特払い = ⌊ 賭け額 × (1 − D) ⌋</div>
    </div>
  </div>
  </div>`;
}

export function strengthCalcModal(): string {
  return `<dialog class="modal" id="strength-modal">
    <h2>評価点</h2>
    <p class="note">Seed の比に使う数字です。開催条件・ステ目標と出走材料（OCR＋脚質）が揃えば <code>computeScore</code> で自動算出し、評価点に載せます。</p>
    <p class="note">自動算出が使えないとき（開催条件なし・脚質未選択・材料なし）や、「評価点を直置き」チェック時だけ手入力が正になります。</p>
    <form method="dialog"><button type="submit">閉じる</button></form>
  </dialog>
  <script>
    const dlg = document.getElementById("strength-modal");
    const openBtn = document.getElementById("strength-detail");
    if (dlg && openBtn) openBtn.addEventListener("click", () => dlg.showModal());
    if (dlg) {
      dlg.addEventListener("click", (ev) => {
        const r = dlg.getBoundingClientRect();
        const inside =
          ev.clientX >= r.left && ev.clientX <= r.right &&
          ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside) dlg.close();
      });
    }
  </script>`;
}

export function betTabsHtml(active: BetKind, enabledRaw: string): string {
  const enabled = parseEnabledKinds(enabledRaw);
  const kind = enabled.includes(active) ? active : "win";
  return `<nav class="bet-tabs">${enabled.map(
    (k) =>
      `<a href="/bet?kind=${k}" class="${k === kind ? "on" : ""}">${BET_KIND_LABEL[k]}</a>`,
  ).join("")}</nav>
  <p class="bet-blurb">${escapeHtml(BET_KIND_BLURB[kind])}</p>`;
}

/** 投票開始前だけ編集。単勝は外せない */
export function enabledKindsAdminFields(event: EventRow): string {
  const enabled = new Set(parseEnabledKinds(event.enabled_kinds));
  const setup = event.status === "setup";
  const note = setup
    ? `<p class="note">単勝は必ず使います。ほかは投票開始前だけ変えられます。初期は全部オンです。</p>`
    : `<p class="note">投票開始後は賭式を変えません。いま有効なのは ${escapeHtml(
        parseEnabledKinds(event.enabled_kinds)
          .map((k) => BET_KIND_LABEL[k])
          .join("、"),
      )} です。</p>`;
  const rest = OPTIONAL_BET_KINDS.map((k) => {
    const on = enabled.has(k);
    const dis = setup ? "" : " disabled";
    return `<label class="kind-opt"><input type="checkbox" name="kind_${k}" value="1"${on ? " checked" : ""}${dis}> ${BET_KIND_LABEL[k]}</label>`;
  }).join("");
  return `<fieldset class="kind-set">
    <legend>賭式</legend>
    ${note}
    <div class="kind-opts">
      <label class="kind-opt"><input type="checkbox" checked disabled> 単勝（必須）</label>
      <input type="hidden" name="kind_win" value="1">
      ${rest}
    </div>
  </fieldset>`;
}

function selectOpts(
  options: ReadonlyArray<{ value: number | string; label: string }>,
  selected: string | number | null | undefined,
  emptyLabel = "—",
): string {
  const cur = selected == null || selected === "" ? "" : String(selected);
  const head = `<option value="">${escapeHtml(emptyLabel)}</option>`;
  const body = options
    .map((o) => {
      const v = String(o.value);
      const sel = v === cur ? " selected" : "";
      return `<option value="${escapeHtml(v)}"${sel}>${escapeHtml(o.label)}</option>`;
    })
    .join("");
  return head + body;
}

/** レースイベント設定内: 開催条件とステ目標値 */
export function scoreSetupAdminFields(event: EventRow): string {
  const setup = eventScoreSetup(event);
  const c = setup?.conditions;
  const r = setup?.requirements;
  const courses = listScoreCourses().map((x) => ({
    value: x.courseKey,
    label: x.label,
  }));
  const num = (n: number | undefined) => (n == null ? "" : String(n));
  const reqVal = (saved: number | undefined, fallback: number) =>
    escapeHtml(saved == null ? String(fallback) : String(saved));
  const ids = setup?.effectiveSkillIds;
  const effectsNote = ids
    ? `有効スキル id（保存時取得）: 逃 ${ids.runner.length} / 先 ${ids.leader.length} / 差 ${ids.betweener.length} / 追 ${ids.chaser.length}${
        setup?.effectsFetchedAt
          ? ` · ${escapeHtml(setup.effectsFetchedAt)}`
          : ""
      }`
    : "有効スキル id: 未取得（コースを選んで保存すると U-tools から取り直します）";
  return `<fieldset class="kind-set">
    <legend>開催条件とステ目標値</legend>
    <p class="note">評価点の自動算出用。未設定なら Strength 直置きのみ。コースは U-tools 金ドット36。天候・バ場・季節と目標値は開催ごと手打ち（速・パ・根・賢は初期 ${DEFAULT_SCORE_REQ.speedCap}/${DEFAULT_SCORE_REQ.power}/${DEFAULT_SCORE_REQ.guts}/${DEFAULT_SCORE_REQ.wisdom}。スタミナはコース依存のため空）。保存時に選んだコースの有効スキル id（4脚質）を U-tools から取得して開催に固定します。</p>
    <div class="row">
      <label>コース <select name="score_course">${selectOpts(courses, c?.courseKey, "（未設定）")}</select></label>
      <label>天候 <select name="score_weather">${selectOpts(WEATHER_OPTIONS, c?.weather)}</select></label>
      <label>バ場 <select name="score_ground_condition">${selectOpts(GROUND_CONDITION_OPTIONS, c?.groundCondition)}</select></label>
      <label>季節 <select name="score_season">${selectOpts(SEASON_OPTIONS, c?.season)}</select></label>
    </div>
    <div class="row">
      <label>要求スピード <input name="score_speed_cap" type="number" min="1" step="1" value="${reqVal(r?.speedCap, DEFAULT_SCORE_REQ.speedCap)}" placeholder="継承突破なしカンスト"></label>
      <label>要求パ <input name="score_power" type="number" min="1" step="1" value="${reqVal(r?.power, DEFAULT_SCORE_REQ.power)}"></label>
      <label>要求根 <input name="score_guts" type="number" min="1" step="1" value="${reqVal(r?.guts, DEFAULT_SCORE_REQ.guts)}"></label>
      <label>要求賢 <input name="score_wisdom" type="number" min="1" step="1" value="${reqVal(r?.wisdom, DEFAULT_SCORE_REQ.wisdom)}"></label>
    </div>
    <div class="row">
      <label>要求スタ（掛かりなし） <input name="score_stamina_no" type="number" min="1" step="1" value="${escapeHtml(num(r?.staminaNoTempt))}"></label>
      <label>要求スタ（掛かりあり） <input name="score_stamina_with" type="number" min="1" step="1" value="${escapeHtml(num(r?.staminaWithTempt))}"></label>
      <label class="kind-opt"><input type="checkbox" name="score_stamina_race" value="1"${r?.staminaRace ? " checked" : ""}> スタミナ勝負コース</label>
    </div>
    <p class="note">${effectsNote}</p>
  </fieldset>`;
}

export function pickSelects(kind: BetKind, board: Board): string {
  const opts = horseOptions(board, "horse");
  if (kind === "win") {
    return `<label>1着（番号） <select name="h1" required><option value="">—</option>${opts}</select></label>`;
  }
  if (kind === "umaren" || kind === "umatan") {
    const l1 = kind === "umaren" ? "馬A" : "1着";
    const l2 = kind === "umaren" ? "馬B" : "2着";
    return `<label>${l1} <select name="h1" id="sel-h1" required><option value="">—</option>${opts}</select></label>
      <label>${l2} <select name="h2" id="sel-h2" required><option value="">—</option>${opts}</select></label>`;
  }
  return `<label>1着 <select name="h1" id="sel-h1" required><option value="">—</option>${opts}</select></label>
    <label>2着 <select name="h2" id="sel-h2" required><option value="">—</option>${opts}</select></label>
    <label>3着 <select name="h3" id="sel-h3" required><option value="">—</option>${opts}</select></label>`;
}

/** 同じ頭を二度選べない */
export const DEDUPE_SELECT_SCRIPT = `<script>
(() => {
  const sels = ["sel-h1", "sel-h2", "sel-h3"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (sels.length < 2) return;
  const sync = () => {
    const chosen = new Set(sels.map((s) => s.value).filter(Boolean));
    for (const s of sels) {
      const mine = s.value;
      for (const opt of s.options) {
        if (!opt.value) continue;
        const hide = chosen.has(opt.value) && opt.value !== mine;
        opt.hidden = hide;
        opt.disabled = hide;
      }
    }
  };
  sels.forEach((s) => s.addEventListener("change", sync));
  sync();
})();
</script>`;

export type { HorseBoard, BetKind };
