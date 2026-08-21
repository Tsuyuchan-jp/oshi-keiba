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
main { max-width: 920px; margin: 0 auto; padding: 1.25rem; }
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
.flow { display: flex; flex-direction: column; gap: .55rem; font-family: "Hiragino Sans", "Yu Gothic", sans-serif; margin: 0 0 1rem; }
.flow-step {
  border-left: 3px solid var(--line);
  padding: .5rem .75rem;
  background: #f7f3ea;
}
.flow-step.on { border-left-color: var(--accent); background: #eef6ee; }
.flow-step.pay { border-left-color: var(--stamp); background: #f8eee8; }
.flow-step.dim { opacity: .48; }
.flow-k { font-size: .72rem; letter-spacing: .08em; color: var(--muted); margin-bottom: .2rem; }
.eq { font-family: ui-monospace, "Cascadia Code", "Yu Gothic", monospace; font-size: .9rem; line-height: 1.45; }
.plug { font-size: .82rem; margin-top: .25rem; font-variant-numeric: tabular-nums; }
.flow-arrow { text-align: center; color: var(--muted); font-size: .8rem; line-height: 1; }
.terms { width: 100%; margin: 0 0 1rem; font-size: .82rem; }
.terms th { white-space: nowrap; }
.terms td:first-child { min-width: 9rem; }
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
        <a href="/">オッズ表</a>
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
        <th>#</th><th>ウマ娘</th><th>${label}</th><th>実際の投票額</th><th>初期投票額</th><th>着順</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function wCaption(board: Board): string {
  return `w=${board.w.toFixed(2)}（時間 ${board.wTime.toFixed(2)} × 実際の投票額 ${board.wVolume.toFixed(2)}）　実際の投票額の合計 ${formatPt(board.realTotal)}　S=${board.event.seed_pool_s}　E=${board.event.pull_e}　D=${Math.round(board.event.takeout_d * 100)}%`;
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ja-JP", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

/** 管理画面: 定義 → 式 → いまの 1 頭 */
export function formulaPanel(board: Board): string {
  const e = board.event;
  const live = board.horses.filter((h) => !h.horse.scratched);
  const sample = [...live].sort((a, b) => b.seed - a.seed)[0];
  const strSum = live.reduce((a, h) => a + Math.max(0, h.horse.strength), 0);
  const refNow = e.status === "setup" || e.status === "voting";
  const payNow = e.status === "closed" || e.status === "published";
  const hasClock =
    e.voting_opened_at != null &&
    e.voting_closes_at != null &&
    e.voting_closes_at > e.voting_opened_at;
  const remain = hasClock
    ? Math.min(
        1,
        Math.max(
          0,
          (e.voting_closes_at! - Date.now()) /
            (e.voting_closes_at! - e.voting_opened_at!),
        ),
      )
    : 1;
  const clockPlug = hasClock
    ? `残り ${fmt(remain, 2)}　→ w時 = ${fmt(board.wTime, 3)}`
    : `日時締切なし → 残り = 1 → w時 = ${fmt(board.wTime, 3)}（時計だけでは 0 にしない）`;

  const who = sample
    ? escapeHtml(sample.horse.name)
    : "（出走を入れるとここに名前が入ります）";

  const seedPlug = sample
    ? `仮想の初期投票額 = ${fmt(e.seed_pool_s, 0)} × ${fmt(sample.horse.strength, 1)} / ${fmt(strSum, 1)} = ${fmt(sample.seed, 1)}`
    : `Strength の合計 = ${fmt(strSum, 1)}`;

  const mixPlug = sample
    ? `足した額 = ${fmt(sample.seed, 1)} × ${fmt(board.w, 3)} + ${fmt(sample.real, 0)} = ${fmt(sample.display, 1)}`
    : "";

  const refPlug = sample
    ? `参考オッズ = (${fmt(board.displayTotal, 1)} × (1 − ${fmt(e.takeout_d, 2)})) / ${fmt(sample.display, 1)} = ${formatOdds(sample.referenceOdds)}`
    : `足した額の合計 = ${fmt(board.displayTotal, 1)}`;

  const pool = board.realTotal * (1 - e.takeout_d);
  const confPlug = sample
    ? sample.real > 0
      ? `確定配当 = ${fmt(pool, 1)} / ${fmt(sample.real, 0)} = ${formatOdds(sample.confirmedOdds)}　払戻しの原資 = ${fmt(pool, 1)}`
      : `この頭の実際の投票額が 0 → 確定配当は出せない`
    : `実際の投票額の合計 = ${fmt(board.realTotal, 0)}　払戻しの原資 = ${fmt(pool, 1)}`;

  const nowLine = refNow
    ? `今オッズ表に出しているのは参考オッズです。払う約束ではありません。`
    : payNow
      ? `今払うのは確定配当です。仮想の初期投票額は入れません。`
      : "";

  return `<table class="terms">
      <thead>
        <tr><th>画面で言うこと</th><th>記号</th><th>何の数字か</th></tr>
      </thead>
      <tbody>
        <tr><td>仮想のユーザー所持額</td><td>残高</td><td>今持っているポイント</td></tr>
        <tr><td>毎週配る仮想ポイント</td><td>G</td><td>口座に足す額。オッズの式には入らない。G を変えても S と E は動かない</td></tr>
        <tr><td>投票の刻み</td><td>単位</td><td>一度に賭けられる最小のポイント</td></tr>
        <tr><td>当アプリが算出した仮想の初期投票額</td><td>Seed</td><td>誰も買っていなくても乗せる分。払わない。頭ごと</td></tr>
        <tr><td>仮想の初期投票額の合計</td><td>S</td><td>開始直後の仮想の初期投票額を何ポイント分置くか</td></tr>
        <tr><td>メンバーが実際に賭けた投票額</td><td>Real / V</td><td>口座から減った分。頭ごと。締切後はこれで払う</td></tr>
        <tr><td>実際の投票額の合計</td><td>TV</td><td>取消していない頭の、実際の投票額を足したもの</td></tr>
        <tr><td>初期投票額をどれだけ残すか</td><td>w</td><td>1 に近いほど仮想の初期投票額が残る。0 なら実際の投票額だけ</td></tr>
        <tr><td>実際の投票額に寄せ始める目安</td><td>E</td><td>賭け上限ではない。実際の投票額の合計がこれに近づくと、初期投票額を薄くする</td></tr>
        <tr><td>参考オッズを出すために足した額</td><td>（内部 Display）</td><td>初期投票額×w ＋ 実際の投票額。倍率そのものではない</td></tr>
        <tr><td>控除</td><td>D</td><td>払うとき、合計から除く割合（0.2 なら 2 割引き、8 割を分ける）</td></tr>
        <tr><td>払戻しの原資</td><td>TV × (1 − D)</td><td>実際の投票額の合計から控除したあと、分け合うまとまり</td></tr>
      </tbody>
    </table>
    <p class="note">${nowLine}例に使う頭は、仮想の初期投票額が一番大きい ${who} です。</p>
    <div class="flow">
    <div class="flow-step">
      <div class="flow-k">口座（オッズの式に入れない）</div>
      <div class="eq">G = ${fmt(e.grant_g, 0)}　単位 = ${fmt(e.bet_unit, 0)}</div>
      <div class="plug">仮想のユーザー所持額（残高）へ足す</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">1　仮想の初期投票額</div>
      <div class="eq">Seed<sub>i</sub> = S × Strength<sub>i</sub> / Σ Strength</div>
      <div class="plug">${seedPlug}</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">2　初期投票額をどれだけ残すか（w）</div>
      <div class="eq">w<sub>時</sub> = 下限 + (1 − 下限) × 残り<sup>指数</sup></div>
      <div class="eq">w<sub>票</sub> = max(0, 1 − 実際の投票額の合計 / E)</div>
      <div class="eq">w = w<sub>時</sub> × w<sub>票</sub></div>
      <div class="plug">${clockPlug}</div>
      <div class="plug">E = ${fmt(e.pull_e, 0)}　実際の投票額の合計 = ${fmt(board.realTotal, 0)}　→ w<sub>票</sub> = ${fmt(board.wVolume, 3)}</div>
      <div class="plug">w = ${fmt(board.wTime, 3)} × ${fmt(board.wVolume, 3)} = ${fmt(board.w, 3)}　／　実際の投票額の合計が E の半分なら、票の側はだいたい半分。票の側の下限は 0。時間の下限は厚め</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step ${refNow ? "on" : "dim"}">
      <div class="flow-k">3　参考オッズ（投票中に出す。払わない）</div>
      <div class="eq">足した額<sub>i</sub> = Seed<sub>i</sub> × w + Real<sub>i</sub></div>
      <div class="eq">参考オッズ<sub>i</sub> = (足した額の合計 × (1 − D)) / 足した額<sub>i</sub></div>
      <div class="plug">${mixPlug}</div>
      <div class="plug">${refPlug}</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step ${payNow ? "pay" : "dim"}">
      <div class="flow-k">4　確定配当（締切後に払う。仮想の初期投票額は入れない）</div>
      <div class="eq">払戻しの原資 = TV × (1 − D)</div>
      <div class="eq">確定配当<sub>i</sub> = 払戻しの原資 / Real<sub>i</sub></div>
      <div class="eq">払戻 = ⌊ 実際の投票額 × 確定配当 ⌋</div>
      <div class="plug">D = ${fmt(e.takeout_d, 2)}　${confPlug}</div>
    </div>
  </div>`;
}

export const HINT = `画面の数字はすべて仮です。毎週配る仮想ポイント G=${DEFAULTS.grantG}、単位 ${DEFAULTS.betUnit}、典型一張りは ${DEFAULTS.typicalBet} を本命。G を変えても S と E は自動では動きません。`;
