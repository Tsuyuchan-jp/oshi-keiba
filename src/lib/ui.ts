import { escapeHtml } from "./http";
import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  type BetKind,
} from "./bets";
import type {
  BetRow,
  Board,
  EventStatus,
  HorseBoard,
} from "./store";
import { numberByHorseId } from "./store";
import { IMPUTED_LAMBDA } from "./odds";

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

/** 404/500 用。メンバー画面は各 layout、管理は adminLayout */
export function plainErrorPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif; background: #050607; color: #e8eeea; }
    main { padding: 2rem 1.25rem; max-width: 28rem; }
    a { color: #e0b34a; }
    p { line-height: 1.55; color: #9aa8a4; }
  </style>
</head>
<body>
  <main>
    <p><a href="/">OSHI KEIBA</a></p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}

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

export function flashHtml(msg: string | null, isError = false): string {
  if (!msg) return "";
  return `<div class="flash${isError ? " error" : ""}">${escapeHtml(msg)}</div>`;
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

export type { HorseBoard, BetKind };
