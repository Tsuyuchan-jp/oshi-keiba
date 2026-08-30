/**
 * 窓口。HTML 構造・クラスは quiet モック。name / POST / 賭式は本番。
 * 買いUIはマークカード（セレクトなし）。
 */
import { escapeHtml } from "./http.ts";
import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  parseEnabledKinds,
  type BetKind,
} from "./bets.ts";
import { horseSheetParts } from "./horseName.ts";
import {
  numberByHorseId,
  type Board,
  type EventStatus,
  type UserRow,
} from "./store.ts";
import {
  flashHtml,
  formatOdds,
  howToModal,
} from "./ui.ts";
import { BET_CSS } from "./betCss.ts";
import { betKindSlots } from "./betBoard.ts";
import { memberMoreScript, memberOutLinks } from "./memberShell.ts";

export { betKindSlots, type BetSlotSpec } from "./betBoard.ts";

function phasePill(status: EventStatus): string {
  const idle = status === "voting" ? "" : " idle";
  const short =
    status === "voting"
      ? "投票中"
      : status === "closed"
        ? "投票締切"
        : status === "published"
          ? "結果公開"
          : "出走登録中";
  return `<span class="pill${idle}"><span class="dot"></span>${escapeHtml(short)}</span>`;
}

function shellChrome(opts: {
  user: UserRow;
  eventStatus: EventStatus;
}): string {
  return `<header class="chrome">
    <div>
      <a class="brand" href="/">OSHI KEIBA</a>
      <div class="who">${escapeHtml(opts.user.display_name)}</div>
    </div>
    <div class="chrome-end">
      <div class="nav">
        ${phasePill(opts.eventStatus)}
        <a href="/">場内</a>
        <a class="on" href="/bet">窓口</a>
      </div>
      <button type="button" class="more-btn" id="more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button>
      <div class="more-pop" id="more-pop">
        <a href="#" id="howto-open">使い方</a>
        <a href="/logout">ログアウト</a>
        <a href="/admin">管理者</a>
      </div>
    </div>
  </header>`;
}

function shellFoot(): string {
  return `${memberOutLinks()}
  ${howToModal()}
  ${memberMoreScript()}`;
}

function pageWrap(opts: {
  user: UserRow;
  eventStatus: EventStatus;
  bodyInner: string;
  scripts?: string;
}): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>窓口</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${BET_CSS}</style>
</head>
<body>
  <div class="scene">
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      ${shellChrome({ user: opts.user, eventStatus: opts.eventStatus })}
      ${opts.bodyInner}
    </div>
  </div>
  ${shellFoot()}
  ${opts.scripts ?? ""}
</body>
</html>`;
}

export function betJoinPage(opts: {
  board: Board;
  user: UserRow;
  flash: { text: string | null; error: boolean };
  joinLabel: string;
}): string {
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const bal = opts.user.balance.toLocaleString("ja-JP");
  return pageWrap({
    user: opts.user,
    eventStatus: opts.board.event.status,
    bodyInner: `<div class="purse">
        <span class="k">いまの所持</span>
        <div><span class="v">${bal}</span><span class="u">スペ</span></div>
      </div>
      <div class="desk-plain">
        ${flash}
        <h1>窓口</h1>
        <p class="lead">投票中です。参加するとこの開催のスペが入り、馬券を買えます。</p>
        <form method="post" action="/bet/join">
          <button type="submit" class="join-btn">${escapeHtml(opts.joinLabel)}</button>
        </form>
      </div>`,
  });
}

export function betClosedPage(opts: {
  board: Board;
  user: UserRow;
  flash: { text: string | null; error: boolean };
  myBetsHtml?: string;
}): string {
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const bal = opts.user.balance.toLocaleString("ja-JP");
  const tickets = opts.myBetsHtml
    ? `<div class="tickets"><h2>自分の馬券</h2>${opts.myBetsHtml}</div>`
    : "";
  return pageWrap({
    user: opts.user,
    eventStatus: opts.board.event.status,
    bodyInner: `<div class="purse">
        <span class="k">いまの所持</span>
        <div><span class="v">${bal}</span><span class="u">スペ</span></div>
      </div>
      <div class="desk-plain">
        ${flash}
        <h1>窓口</h1>
        <p class="lead">いまは投票期間外です。場内でオッズを見てください。</p>
        <p class="hint"><a href="/">場内へ戻る</a></p>
        ${tickets}
      </div>`,
  });
}

function kindsNavHtml(active: BetKind, enabledRaw: string): string {
  const enabled = new Set(parseEnabledKinds(enabledRaw));
  return `<div class="kinds" id="kinds">${(["win", "umaren", "umatan", "sanrenpuku", "sanrentan"] as BetKind[])
    .map((k) => {
      const label = BET_KIND_LABEL[k];
      if (!enabled.has(k)) {
        return `<span>${escapeHtml(label)}</span>`;
      }
      const on = k === active ? " on" : "";
      return `<a class="${on.trim()}" href="/bet?kind=${k}">${escapeHtml(label)}</a>`;
    })
    .join("")}</div>`;
}

function comboMiniHtml(board: Board, kind: BetKind): string {
  if (kind === "win") return "";
  const pool = board.pools.find((p) => p.kind === kind);
  const nums = numberByHorseId(board);
  const title = `${BET_KIND_LABEL[kind]}のオッズ`;
  if (!pool || pool.combos.length === 0) {
    return `<div class="odds-mini"><h2>${escapeHtml(title)}</h2><p class="hint">—</p></div>`;
  }
  const rows = pool.combos
    .map((c) => {
      const lab = formatSelectionLabel(
        kind,
        c.horse_1,
        c.horse_2,
        c.horse_3,
        nums,
      );
      return `<div class="orow" data-sel="${escapeHtml(c.selection_key)}"><span>${escapeHtml(lab)}</span><span class="odds-now">${formatOdds(c.odds)}</span></div>`;
    })
    .join("");
  return `<div class="odds-mini combo-list"><h2>${escapeHtml(title)}</h2>${rows}</div>`;
}

function markCardScript(opts: {
  kind: BetKind;
  balance: number;
  unit: number;
  horses: { id: string; number: number; umaName: string; odds: number | null }[];
  candidateHorseId?: string | null;
  preview?: boolean;
}): string {
  const slots = betKindSlots(opts.kind);
  return `<script>
(() => {
  const kind = ${JSON.stringify(opts.kind)};
  const kindLabel = ${JSON.stringify(BET_KIND_LABEL[opts.kind])};
  const labels = ${JSON.stringify(slots.labels)};
  const ordered = ${JSON.stringify(slots.ordered)};
  const hint = ${JSON.stringify(slots.hint)};
  const unit = ${opts.unit};
  const bal = ${opts.balance};
  const preview = ${opts.preview ? "true" : "false"};
  const horses = ${JSON.stringify(opts.horses)};
  const byNum = new Map(horses.map((h) => [h.number, h]));
  let picks = labels.map(() => null);
  const candidate = horses.find((horse) => horse.id === ${JSON.stringify(opts.candidateHorseId ?? null)});
  if (candidate) picks[0] = candidate.number;
  let amount = 0;
  const form = document.getElementById("bet-form");
  const h1 = document.getElementById("h1");
  const h2 = document.getElementById("h2");
  const h3 = document.getElementById("h3");
  const amountInput = document.getElementById("bet-amount");
  const buy = document.getElementById("buy");
  const wells = document.getElementById("wells");
  const board = document.getElementById("board");
  const amtEl = document.getElementById("amt");
  const restEl = document.getElementById("rest");
  const hintEl = document.getElementById("hint");
  if (hintEl) hintEl.textContent = hint;
  const cap = Math.floor(bal / unit) * unit;
  const setAmt = (n) => {
    amount = Math.max(0, Math.min(cap, Math.floor(n / unit) * unit));
    amountInput.value = String(amount);
    paint();
  };
  function ready() {
    return picks.every((x) => x != null) && amount >= unit && amount <= bal;
  }
  function syncHidden() {
    const ids = picks.map((n) => (n == null ? "" : byNum.get(n)?.id || ""));
    h1.value = ids[0] || "";
    h2.value = ids[1] || "";
    h3.value = ids[2] || "";
    amountInput.value = String(amount);
    buy.disabled = preview || !ready();
  }
  function paint() {
    const used = new Set(picks.filter((x) => x != null));
    wells.innerHTML = labels.map((name, i) => {
      const n = picks[i];
      const h = n != null ? byNum.get(n) : null;
      const odds =
        h && kind === "win" && h.odds != null
          ? \`<span class="o">\${Number(h.odds).toFixed(1)}倍</span>\`
          : "";
      return \`<button type="button" class="well\${h ? " fill" : ""}" data-well="\${i}">
        <span class="k">\${name}</span>
        <span class="v">\${h ? n + " " + h.umaName : "タップで選択"}</span>
        \${odds}
      </button>\`;
    }).join("");
    board.innerHTML = horses.map((h) => {
      const on = picks.includes(h.number);
      const od = h.odds == null || !Number.isFinite(h.odds) ? "—" : Number(h.odds).toFixed(1);
      return \`<button type="button" class="chip\${on ? " on" : ""}" data-n="\${h.number}" data-sel="\${h.id}" data-horse-id="\${h.id}">
        <span class="n">\${h.number}</span><span class="uma">\${h.umaName}</span><span class="od odds-now">\${od}</span>
      </button>\`;
    }).join("");
    amtEl.textContent = amount.toLocaleString("ja-JP");
    restEl.textContent = Math.max(0, bal - amount).toLocaleString("ja-JP");
    syncHidden();
  }
  wells.addEventListener("click", (e) => {
    const b = e.target.closest("[data-well]");
    if (!b) return;
    picks[Number(b.dataset.well)] = null;
    paint();
  });
  board.addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    const n = Number(b.dataset.n);
    const i = picks.indexOf(n);
    if (i >= 0) { picks[i] = null; paint(); return; }
    const hole = picks.findIndex((x) => x == null);
    if (hole >= 0) picks[hole] = n;
    paint();
  });
  document.querySelector(".amt-row")?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.add) setAmt(amount + Number(b.dataset.add));
    else if (b.dataset.set) setAmt(Number(b.dataset.set));
    else if (b.hasAttribute("data-all")) setAmt(cap);
  });
  form.addEventListener("submit", (ev) => {
    if (preview) {
      ev.preventDefault();
      return;
    }
    syncHidden();
    if (!ready()) {
      ev.preventDefault();
      alert("買い目と金額（" + unit + " スペ単位）を入れてください");
      return;
    }
    const names = picks.map((n) => {
      const h = byNum.get(n);
      return h ? n + " " + h.umaName : String(n);
    });
    const line = ordered ? names.join(" → ") : [...picks].sort((a,b)=>a-b).map((n) => {
      const h = byNum.get(n);
      return h ? n + " " + h.umaName : String(n);
    }).join(" - ");
    const msg = "この内容で買いますか？\\n\\n" + kindLabel + "\\n" + line + "\\n" + amount.toLocaleString("ja-JP") + " スペ";
    if (!confirm(msg)) ev.preventDefault();
  });
  paint();
})();
</script>`;
}

export function betBuyPage(opts: {
  board: Board;
  user: UserRow;
  kind: BetKind;
  flash: { text: string | null; error: boolean };
  myBetsHtml: string;
  redoHtml: string;
  scripts?: string;
  candidateHorseId?: string | null;
  preview?: boolean;
}): string {
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const bal = opts.user.balance.toLocaleString("ja-JP");
  const slots = betKindSlots(opts.kind);
  const horses = opts.board.horses
    .filter((h) => !h.horse.scratched)
    .map((h) => {
      const parts = horseSheetParts(h.horse);
      return {
        id: h.horse.id,
        number: h.number,
        umaName: parts.umaName,
        odds: h.referenceOdds,
      };
    });
  const bodyInner = `<div class="purse">
      <span class="k">いまの所持</span>
      <div><span class="v" id="bal">${bal}</span><span class="u">スペ</span></div>
    </div>
    <form method="post" action="/bet" class="desk" id="bet-form">
      <input type="hidden" name="kind" value="${opts.kind}">
      <input type="hidden" name="h1" id="h1" value="">
      <input type="hidden" name="h2" id="h2" value="">
      <input type="hidden" name="h3" id="h3" value="">
      <input type="hidden" name="amount" id="bet-amount" value="0">
      <div class="desk-scroll">
        ${flash}
        ${opts.preview ? `<p class="admin-preview">管理者プレビュー：馬券の購入・参加はできません。</p>` : ""}
        ${kindsNavHtml(opts.kind, opts.board.event.enabled_kinds)}
        <p class="hint" id="hint">${escapeHtml(slots.hint)}</p>
        <div class="wells" id="wells"></div>
        <div class="board" id="board"></div>
        ${comboMiniHtml(opts.board, opts.kind)}
        <div class="tickets">
          <h2>自分の馬券</h2>
          ${opts.myBetsHtml}
          ${opts.redoHtml}
        </div>
      </div>
      <div class="dock">
        <div class="amt-box">
          <div class="amt-show">金額 <b id="amt">0</b><span> スペ</span>
            <span class="rest">買うと残り <b id="rest">${bal}</b></span>
          </div>
          <div class="amt-row">
            <button type="button" data-add="100">+100</button>
            <button type="button" data-add="500">+500</button>
            <button type="button" data-set="${opts.board.event.bet_unit}">${opts.board.event.bet_unit}</button>
            <button type="button" data-all>残り</button>
          </div>
        </div>
        <button type="submit" class="buy" id="buy" disabled>買う</button>
      </div>
    </form>
    <form id="redo-form" method="post" action="/bet/redo" hidden></form>`;
  return pageWrap({
    user: opts.user,
    eventStatus: opts.board.event.status,
    bodyInner,
    scripts:
      markCardScript({
        kind: opts.kind,
        balance: opts.user.balance,
        unit: opts.board.event.bet_unit,
        horses,
        candidateHorseId: opts.candidateHorseId,
        preview: opts.preview,
      }) + (opts.scripts ?? ""),
  });
}
