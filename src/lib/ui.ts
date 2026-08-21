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
nav.links span { color: var(--muted); }
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
.flow-k { font-size: .72rem; letter-spacing: .08em; color: var(--muted); margin-bottom: .2rem; }
.eq, .plug {
  font-family: ui-monospace, "Cascadia Code", "Yu Gothic", "Hiragino Sans", sans-serif;
  font-size: .9rem;
  line-height: 1.55;
}
.plug { font-size: .82rem; margin-top: .25rem; }
.story {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .88rem;
  line-height: 1.7;
  margin: 0 0 .65rem;
}
.story p { margin: 0 0 .55rem; }
.story p:last-child { margin-bottom: .4rem; }
.flow-arrow { text-align: center; color: var(--muted); font-size: .8rem; line-height: 1; }
.terms { width: 100%; margin: .5rem 0 0; font-size: .82rem; }
.terms th { white-space: nowrap; }
.terms td:nth-child(2) { min-width: 9rem; }
details.terms-box { margin: 0 0 1rem; }
details.terms-box summary {
  cursor: pointer;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: .9rem;
  padding: .35rem 0;
}
`;

export function layout(opts: {
  title: string;
  user?: UserRow | null;
  body: string;
  admin?: boolean;
  /** オッズ表は会員ログインを出さない（文言だけ残してよい） */
  loginNav?: "link" | "text";
}): string {
  const who = opts.user
    ? `${escapeHtml(opts.user.display_name)}　${formatPt(opts.user.balance)}`
    : "未ログイン";
  const loginItem = opts.user
    ? `<a href="/logout">ログアウト</a>`
    : opts.loginNav === "text"
      ? `<span>ログイン</span>`
      : `<a href="/login">ログイン</a>`;
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
        <a href="/demo">デモ用投票画面</a>
        ${loginItem}
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

/** 管理画面: 定義 → 物語（記号つき）→ 式だけ */
export function formulaPanel(board: Board): string {
  const e = board.event;
  const nowLine =
    e.status === "setup" || e.status === "voting"
      ? `今オッズ表に出しているのは参考オッズです。確定配当ではありません。`
      : e.status === "closed" || e.status === "published"
        ? `今オッズ表に出しているのは確定配当です。仮想の初期投票額は計算に入れません。`
        : "";

  return `<details class="terms-box">
      <summary>定義表（参考）</summary>
      <table class="terms">
      <thead>
        <tr><th>記号</th><th>画面で言うこと</th><th>何の数字か</th></tr>
      </thead>
      <tbody>
        <tr><td>残高</td><td>仮想のユーザー所持額</td><td>今持っているポイント</td></tr>
        <tr><td>G</td><td>毎週配る仮想ポイント</td><td>口座に足す額。オッズの式には入らない。G を変えても S と E は動かない</td></tr>
        <tr><td>単位</td><td>投票の刻み</td><td>一度に賭けられる最小のポイント</td></tr>
        <tr><td>i</td><td>そのウマ娘</td><td>式の右下の小さな文字。1 頭ずつの数字につける。S や TV など出走全体には付けない</td></tr>
        <tr><td>Strength</td><td>この出走メンバーの中での相対評価点</td><td>ウマ娘 1 頭あたり。場の外の点数ではない。デモでは直置き</td></tr>
        <tr><td>Σ Strength</td><td>評価点合計</td><td>取消していないウマ娘の相対評価点を足したもの</td></tr>
        <tr><td>Seed</td><td>当アプリが算出した仮想の初期投票額</td><td>誰も買っていなくても乗せる分。払わない。ウマ娘 1 頭あたり</td></tr>
        <tr><td>S</td><td>仮想の初期投票額の合計</td><td>開始直後の仮想の初期投票額を何ポイント分置くか</td></tr>
        <tr><td>Real / V</td><td>メンバーが実際に賭けた投票額</td><td>口座から減った分。ウマ娘 1 頭あたり。締切後はこれで払う</td></tr>
        <tr><td>TV</td><td>実際の投票額の合計</td><td>取消していないウマ娘の、実際の投票額を足したもの</td></tr>
        <tr><td>w</td><td>初期投票額をどれだけ残すか</td><td>1 に近いほど仮想の初期投票額が残る。0 なら実際の投票額だけ</td></tr>
        <tr><td>w時</td><td>時間による残り方</td><td>投票時間の経過で、初期投票額をどれだけ残すか。時計だけでは 0 にしない</td></tr>
        <tr><td>下限</td><td>時間側の下限</td><td>時間だけ進んでも残す割合。厚め</td></tr>
        <tr><td>残り</td><td>投票時間の残り割合</td><td>1 が開始直後、0 が日時締切。締切未設定なら 1 のまま</td></tr>
        <tr><td>指数</td><td>曲線の指数</td><td>残り方の曲がり。1 なら直線</td></tr>
        <tr><td>w票</td><td>実際の投票額による薄め</td><td>実際の投票額の合計が E に近づくほど小さくなる。下限 0</td></tr>
        <tr><td>E</td><td>実際の投票額に寄せ始める目安</td><td>賭け上限ではない。実際の投票額の合計がこれに近づくと、初期投票額を薄くする</td></tr>
        <tr><td>Display</td><td>参考オッズを出すために足した額</td><td>Seed×w ＋ Real。ウマ娘 1 頭あたり。倍率そのものではない</td></tr>
        <tr><td>Σ Display</td><td>Display の合計</td><td>取消していないウマ娘の Display を足したもの</td></tr>
        <tr><td>D</td><td>控除</td><td>払うとき、合計から除く割合（0.2 なら 2 割引き、8 割を分ける）</td></tr>
        <tr><td>TV × (1 − D)</td><td>払戻しの原資</td><td>実際の投票額の合計から控除したあと、分け合うまとまり</td></tr>
      </tbody>
    </table>
    </details>
    <p class="note">${nowLine}</p>
    <div class="flow">
    <div class="flow-step">
      <div class="flow-k">口座（オッズの式に入れない）</div>
      <div class="story">
        <p>毎週配る仮想ポイント【G】を、仮想のユーザー所持額【残高】へ足す。投票の刻み【単位】は、一度に賭けられる最小のポイント。</p>
      </div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">1　仮想の初期投票額</div>
      <div class="story">
        <p>まだ誰も買っていなくても、当アプリが仮想の初期投票額【Seed】を乗せる。合計が【S】。各ウマ娘への分け方は、この出走メンバーの中での相対評価点【Strength】の比。小さな i は「そのウマ娘」。</p>
      </div>
      <div class="eq">Seed<sub>i</sub> = S × Strength<sub>i</sub> / Σ Strength</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">2　参考オッズを、仮想と実際のどちらに寄せるか（w）</div>
      <div class="story">
        <p>参考オッズは、仮想の初期投票額【Seed】と、実際の投票額【Real】を混ぜて出す。【w】は、混ぜるときに仮想の初期投票額を何割残すか。1 に近いほど仮想が効く。0 なら実際の投票額だけになる。</p>
        <p>寄せる原因は二つある。</p>
        <p>一つめは時間【w<sub>時</sub>】。投票の開始から日時締切に向かって時間が進むと、仮想の初期投票額の効きを弱くする（w<sub>時</sub> が下がる）。弱くはするが、時間だけが理由では 0 まで下げない。下限を残す。誰も賭けていなくても、開始時の付け方が参考オッズに少し残るようにするため。日時締切を置いていないときは、時間では減らさない。</p>
        <p>二つめは実際の投票【w<sub>票</sub>】。実際の投票額の合計【TV】が、寄せ始める目安【E】に近づくと、仮想の効きを弱くする（w<sub>票</sub> が下がる）。TV が E の半分なら、だいたい半分。E まで貯まると、こちらは 0 まで下げてよい。参考オッズは実際の投票額に寄る。</p>
        <p>最後に掛けて【w】=【w<sub>時</sub>】×【w<sub>票</sub>】にする。時間だけでは 0 にならない（w<sub>時</sub> に下限がある）。実際の投票が十分なら 0 にできる（w<sub>票</sub> が 0）。</p>
      </div>
      <div class="eq">w<sub>時</sub> = 下限 + (1 − 下限) × 残り<sup>指数</sup></div>
      <div class="eq">w<sub>票</sub> = max(0, 1 − TV / E)</div>
      <div class="eq">w = w<sub>時</sub> × w<sub>票</sub></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">3　参考オッズ（投票中に出す。確定配当ではない）</div>
      <div class="story">
        <p>そのウマ娘について、仮想の初期投票額【Seed<sub>i</sub>】を【w】で薄め、実際の投票額【Real<sub>i</sub>】と足す。この混ぜた値を【Display<sub>i</sub>】と呼ぶ（参考オッズを出すために足した額。倍率そのものではない）。取消していないウマ娘の Display を足したものが【Σ Display】。これと控除【D】から参考オッズ（倍率）を出す。確定配当ではない。</p>
      </div>
      <div class="eq">Display<sub>i</sub> = Seed<sub>i</sub> × w + Real<sub>i</sub></div>
      <div class="eq">参考オッズ<sub>i</sub> = (Σ Display × (1 − D)) / Display<sub>i</sub></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">4　確定配当（締切後。仮想の初期投票額は計算に入れない）</div>
      <div class="story">
        <p>確定配当は、実際の投票額だけで決める。仮想の初期投票額は計算に入れない。実際の投票額の合計【TV】から控除【D】を除いたものが払戻しの原資。それを、そのウマ娘の実際の投票額【Real<sub>i</sub>】で割ると確定配当。口座に戻す額（払戻）は、賭けた投票額に確定配当を掛けて、小数を切り捨てる。</p>
      </div>
      <div class="eq">払戻しの原資 = TV × (1 − D)</div>
      <div class="eq">確定配当<sub>i</sub> = 払戻しの原資 / Real<sub>i</sub></div>
      <div class="eq">払戻 = ⌊ 実際の投票額 × 確定配当 ⌋</div>
    </div>
  </div>`;
}

export const HINT = `画面の数字はすべて仮です。毎週配る仮想ポイント G=${DEFAULTS.grantG}、単位 ${DEFAULTS.betUnit}、典型一張りは ${DEFAULTS.typicalBet} を本命。G を変えても S と E は自動では動きません。`;
