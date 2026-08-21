import { escapeHtml } from "./http";
import { DEFAULTS } from "./odds";
import type { Board, EventStatus, UserRow } from "./store";

export function formatOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}倍`;
}

export function formatPt(n: number): string {
  return `${n.toLocaleString("ja-JP")} pt`;
}

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case "setup":
      return "出走登録中";
    case "voting":
      return "投票中（参考オッズ）";
    case "closed":
      return "締切済み（確定配当）";
    case "published":
      return "結果公開";
  }
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
  align-items: baseline;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}
header.app a { color: var(--accent); }
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
main { max-width: 860px; margin: 0 auto; padding: 1.25rem; }
.card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1rem 1.1rem;
  margin: 0 0 1rem;
}
h1, h2 { font-weight: 600; letter-spacing: .04em; }
h1 { font-size: 1.35rem; margin: 0 0 .4rem; }
h2 { font-size: 1.05rem; margin: 0 0 .75rem; }
.muted { color: var(--muted); font-size: .92rem; }
.row { display: flex; flex-wrap: wrap; gap: .6rem; align-items: end; }
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
table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: .92rem; }
th, td { text-align: left; padding: .45rem .4rem; border-bottom: 1px solid var(--line); }
th { font-size: .78rem; color: var(--muted); font-weight: 600; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.flash { background: #fff3d8; border: 1px solid #e4c98a; padding: .6rem .8rem; margin-bottom: 1rem; }
.error { background: #f8e4e0; border-color: #d9a59b; }
nav.links { display: flex; gap: .8rem; flex-wrap: wrap; font-family: sans-serif; font-size: .85rem; }
.note { font-size: .85rem; color: var(--muted); line-height: 1.5; }
.scr { opacity: .55; text-decoration: line-through; }
.chips { display: flex; flex-wrap: wrap; gap: .35rem; margin: .5rem 0 1rem; }
.chip {
  font-family: sans-serif;
  font-size: .8rem;
  padding: .25rem .5rem;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  border-radius: 999px;
  cursor: pointer;
}
.chip.on { background: var(--accent); color: #fff; border-color: var(--accent); }
tr.desk-focus { outline: 2px solid var(--accent); background: #eef6ee; }
.desk-row td { vertical-align: middle; }
.desk-row form { margin: 0; }
`;

export function layout(opts: {
  title: string;
  user?: UserRow | null;
  body: string;
  admin?: boolean;
}): string {
  const who = opts.user
    ? `${escapeHtml(opts.user.display_name)}　${formatPt(opts.user.balance)}`
    : "未ログイン";
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
    <div>
      <strong>oshi-keiba</strong><span class="stamp">仮</span>
      <div class="muted">仮想ポイント馬券　換金しません</div>
    </div>
    <div>
      <div class="muted">${who}</div>
      <nav class="links">
        <a href="/">板</a>
        <a href="/demo">デモ卓</a>
        ${opts.user ? `<a href="/logout">ログアウト</a>` : `<a href="/login">ログイン</a>`}
        <a href="/admin">${opts.admin ? "管理" : "管理者"}</a>
      </nav>
    </div>
  </header>
  <main>${opts.body}</main>
</body>
</html>`;
}

export function flashHtml(msg: string | null, isError = false): string {
  if (!msg) return "";
  return `<div class="flash${isError ? " error" : ""}">${escapeHtml(msg)}</div>`;
}

export function boardTable(board: Board, opts: { showPlaces: boolean }): string {
  const label =
    board.event.status === "voting" || board.event.status === "setup"
      ? "参考オッズ"
      : "確定配当";
  const rows = board.horses
    .map((h, i) => {
      const odds =
        board.event.status === "voting" || board.event.status === "setup"
          ? h.referenceOdds
          : h.confirmedOdds;
      const place =
        opts.showPlaces && h.horse.finish_place != null
          ? `${h.horse.finish_place}着`
          : "—";
      const mark = h.horse.scratched ? "取消" : `${i + 1}`;
      return `<tr class="${h.horse.scratched ? "scr" : ""}">
        <td>${mark}</td>
        <td>${escapeHtml(h.horse.name)}</td>
        <td class="num">${h.horse.scratched ? "—" : formatOdds(odds)}</td>
        <td class="num">${formatPt(h.real)}</td>
        <td class="num">${h.horse.scratched ? "—" : h.seed.toFixed(0)}</td>
        <td>${place}</td>
      </tr>`;
    })
    .join("");
  return `<table>
    <thead>
      <tr>
        <th>#</th><th>ウマ娘</th><th>${label}</th><th>実票</th><th>Seed</th><th>着順</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function wCaption(board: Board): string {
  return `w=${board.w.toFixed(2)}（時間 ${board.wTime.toFixed(2)} × 票量 ${board.wVolume.toFixed(2)}）　実票合計 ${formatPt(board.realTotal)}　S=${board.event.seed_pool_s}　E=${board.event.pull_e}　D=${Math.round(board.event.takeout_d * 100)}%`;
}

export const HINT = `画面の数字はすべて仮です。毎週配布 G=${DEFAULTS.grantG}、最低単位 ${DEFAULTS.betUnit}、典型一張りは ${DEFAULTS.typicalBet} を本命。G を変えても E と S は自動では動きません。`;
