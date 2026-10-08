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
import { IMPUTED_LAMBDA, isOddsV4, seedForKind } from "./odds";

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

/** 有効投票に対する的中・特払いの比率。分母ゼロは未算出 */
export function formatReturnRate(prizePayout: number, effectiveBet: number): string {
  if (!(effectiveBet > 0)) return "—";
  return `${((100 * prizePayout) / effectiveBet).toFixed(1)}%`;
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
  return `<dialog class="member-modal" id="howto-modal">
    <h2>使い方</h2>
    <section class="howto-sec">
      <h3>スペ</h3>
      <p>ここでのお金は「スペ」です。投票が始まってから「参加する」を押すと、その開催のスペが入ります。入場しただけでは入りません。使い切らなかったスペは、次の開催へ持ち越されます。馬券は 100 スペ単位で買います。</p>
    </section>
    <section class="howto-sec">
      <h3>場内とパドック</h3>
      <p>場内では、出走表とオッズを見ます。馬券を買うときは「馬券を買う」から窓口へ進んでください。投票が始まる前は、場内で待っていれば大丈夫です。</p>
      <p>パドックでは、出走するウマ娘を脚質ごとに見て、1頭の詳しい情報を開けます。気になる子は、窓口の最初の枠へ引き継げます。</p>
    </section>
    <section class="howto-sec">
      <h3>番号</h3>
      <p>表の番号は、このアプリの番号です。ゲーム内の枠番ではありません。買うときは、この番号で選びます。</p>
    </section>
    <section class="howto-sec">
      <h3>オッズ</h3>
      <p>オッズは、誰かが馬券を買うたびに動きます。見えている数字が、的中したときに使われる倍率です。投票が締め切られたあとも、この数字はそのまま「確定配当」になります。締切の瞬間に別の数字へ飛びません。</p>
      <p>単勝、馬連、馬単、3連複、3連単のどれも、まだ誰も買っていなくても数字が出ます。</p>
    </section>
    <section class="howto-sec">
      <h3>買い方</h3>
      <p>賭式はタブで切り替えます。一度に買えるのは1点です。同じ買い目の中で、同じウマ娘を二度は選べません。金額を入れて、確認が出てから購入が決まります。</p>
      <p>締切までは「やりなおし」ができます。自分の馬券がすべて取り消され、使ったスペが戻ります。</p>
    </section>
    <section class="howto-sec">
      <h3>結果</h3>
      <p>結果と着順は、公開されてから出ます。自分の馬券は「自分の馬券」で、的中、外れ、返還がわかります。</p>
      <p>的中した馬券は、賭けたスペに確定配当を掛けた額（端数は切り捨て）が戻ります。選んだ買い目が当たっていなければ、そのスペは戻りません。</p>
      <p>当たりの買い目を、誰も買っていなかった賭式は、その賭式の馬券がすべて外れになります。一部が戻ることはありません。</p>
      <p>出走取消になったウマ娘を含む馬券は、使ったスペが全額戻ります。他人が何を買ったかは見えません。</p>
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
    const winNext = new Map();
    const items = payload.kinds?.[kind] || [];
    for (const it of items) next.set(it.key, it.odds);
    for (const it of payload.kinds?.win || []) winNext.set(it.key, it.odds);
    for (const tr of document.querySelectorAll(rowSel)) {
      const key = tr.getAttribute("data-sel") || tr.getAttribute("data-horse-id");
      const cell = tr.querySelector(".odds-now");
      if (!cell || !key) continue;
      // 馬一覧・場内の行は常に単勝参考オッズ。連勝の買い目行だけ賭式別の値を使う。
      const odds = tr.matches(".chip, .sheet-row") ? winNext.get(key) : next.get(key);
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
    prev = new Map([...next, ...winNext]);
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
  if (isOddsV4(board.event)) {
    const e = board.event;
    return `単勝S=${formatPt(seedForKind(e, "win"))}　馬連=${formatPt(seedForKind(e, "umaren"))}　馬単=${formatPt(seedForKind(e, "umatan"))}　3連複=${formatPt(seedForKind(e, "sanrenpuku"))}　3連単=${formatPt(seedForKind(e, "sanrentan"))}　D=${Math.round(e.takeout_d * 100)}%`;
  }
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
  const legacy = !isOddsV4(board.event);
  return `<div class="formula-box">
    <p class="note">いま: ${escapeHtml(wCaption(board))}</p>
    ${legacy ? `<p class="note">この開催は以前の式で確定済みです。倍率は再計算しません。下は次の開催の式です。</p>` : ""}
    <details class="terms-box">
      <summary>定義表</summary>
      <table class="terms">
      <thead>
        <tr><th>記号</th><th>画面で言うこと</th><th>何の数字か</th></tr>
      </thead>
      <tbody>
        <tr><td>G</td><td>参加で配るスペ</td><td>投票中の初回参加で1回。オッズの式には入らない</td></tr>
        <tr><td>評価点</td><td>相対評価点</td><td>Seed の配分。メンバーには出さない</td></tr>
        <tr><td>S</td><td>賭式ごとの Seed 合計</td><td>単勝だけ入力する。他の4賭式は固定比</td></tr>
        <tr><td>Seed</td><td>買い目の仮想票</td><td>確定配当と払戻に残る</td></tr>
        <tr><td>Real</td><td>その買い目の実票</td><td>Seed に足す。連勝の実票は単勝を動かさない</td></tr>
        <tr><td>D</td><td>控除</td><td>投票中も確定も払戻も同じ率。投票開始後は変えない</td></tr>
      </tbody>
    </table>
    </details>
    <div class="flow">
    <div class="flow-step">
      <div class="flow-k">払いの約束</div>
      <div class="story"><p>投票中のオッズと締切後の確定配当は同じ数字です。払戻は賭け額×そのオッズで、投票額を超えても払います。当たりの買い目に実票が無い賭式は外れで、一部は戻しません。出走取消とやりなおしは全額返還です。</p></div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">1　単勝</div>
      <div class="eq">Seed<sub>i</sub> = S<sub>単勝</sub> × 評価点<sub>i</sub> / Σ 評価点</div>
      <div class="eq">オッズ<sub>i</sub> = (S<sub>単勝</sub> + 単勝実票合計) × (1 − D) / (Seed<sub>i</sub> + その馬の実票)</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">2　連勝（馬連・馬単・3連複・3連単）</div>
      <div class="eq">Seed<sub>c</sub> = S<sub>賭式</sub> × P(c)　γ = 2。評価点の下限は掛けない</div>
      <div class="eq">オッズ<sub>c</sub> = (S<sub>賭式</sub> + その賭式の実票合計) × (1 − D) / (Seed<sub>c</sub> + その買い目の実票)</div>
    </div>
    <div class="flow-arrow">↓</div>
    <div class="flow-step">
      <div class="flow-k">3　払戻</div>
      <div class="eq">払戻 = ⌊ 賭け額 × 確定配当 ⌋</div>
      <div class="eq">移管 = その開催の全投票 − その開催の全払戻・返還</div>
    </div>
  </div>
  </div>`;
}

export type { HorseBoard, BetKind };
