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
  toJstInput,
} from "./ui.ts";
import { BET_CSS } from "./betCss.ts";
import { betKindSlots } from "./betBoard.ts";
import { chromeTimesHtml, memberMoreScript, memberOutLinks } from "./memberShell.ts";
import { memberSceneSlotScript } from "./memberSceneSlot.ts";

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

function closeHm(ms: number | null): string {
  const value = toJstInput(ms);
  return value ? value.slice(11, 16) : "—";
}

function shellChrome(opts: { user: UserRow; board: Board }): string {
  const status = opts.board.event.status;
  const metaNow = status === "voting"
    ? `<span id="meta-now">現在 <strong id="now-clock"></strong></span>`
    : "";
  const metaClose = status === "published"
    ? `<span id="meta-close">払戻済み</span>`
    : status === "closed"
      ? `<span id="meta-close">確定配当</span>`
      : status === "setup"
        ? `<span id="meta-close">投票開始前</span>`
        : `<span id="meta-close">締切 <strong>${escapeHtml(closeHm(opts.board.event.voting_closes_at))}</strong></span>`;
  return `<header class="chrome member-chrome bet-chrome">
    <div class="chrome-brand">
      <a class="brand" href="/">OSHI KEIBA</a>
      <div class="who">${escapeHtml(opts.user.display_name)}</div>
    </div>
    <div class="chrome-state">${phasePill(status)}${chromeTimesHtml(metaNow, metaClose)}</div>
    <nav class="chrome-nav nav" aria-label="ページ移動">
      <a href="/">場内</a>
      <a class="on" href="/bet">窓口</a>
      <a href="/paddock">パドック</a>
    </nav>
    <div class="chrome-menu">
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
  board: Board;
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
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
  <style>${BET_CSS}</style>
</head>
<body>
  <div class="scene member-glass member-glass--bet" data-slot="night">
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      ${shellChrome({ user: opts.user, board: opts.board })}
      ${opts.bodyInner}
    </div>
  </div>
  ${shellFoot()}
  ${memberSceneSlotScript("now-clock")}
  ${opts.scripts ?? ""}
</body>
</html>`;
}

export function betJoinPage(opts: {
  board: Board;
  user: UserRow;
  flash: { text: string | null; error: boolean };
  joinLabel: string;
  kind: BetKind;
  candidateHorseId?: string | null;
  slot?: string | null;
}): string {
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const bal = opts.user.balance.toLocaleString("ja-JP");
  return pageWrap({
    user: opts.user,
    board: opts.board,
    bodyInner: `<div class="purse">
        <span class="k">いまの所持</span>
        <div><span class="v">${bal}</span><span class="u">スペ</span></div>
      </div>
      <div class="desk-plain">
        ${flash}
        <h1>窓口</h1>
        <p class="lead">投票中です。参加するとこの開催のスペが入り、馬券を買えます。</p>
        <form method="post" action="/bet/join">
          <input type="hidden" name="kind" value="${opts.kind}">
          <input type="hidden" name="candidate" value="${escapeHtml(opts.candidateHorseId ?? "")}">
          <input type="hidden" name="slot" value="${escapeHtml(opts.slot ?? "")}">
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
    board: opts.board,
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

function kindsNavHtml(
  active: BetKind,
  enabledRaw: string,
  candidateHorseId: string | null | undefined,
  slot: string | null | undefined,
): string {
  const enabled = new Set(parseEnabledKinds(enabledRaw));
  return `<div class="kinds" id="kinds">${(["win", "umaren", "umatan", "sanrenpuku", "sanrentan"] as BetKind[])
    .map((k) => {
      const label = BET_KIND_LABEL[k];
      if (!enabled.has(k)) {
        return `<span>${escapeHtml(label)}</span>`;
      }
      const on = k === active ? " on" : "";
      const params = new URLSearchParams({ kind: k });
      if (candidateHorseId) params.set("candidate", candidateHorseId);
      if (slot === "day" || slot === "dusk" || slot === "night") params.set("slot", slot);
      return `<a class="${on.trim()}" href="/bet?${params}">${escapeHtml(label)}</a>`;
    })
    .join("")}</div>`;
}

function candidateBarHtml(opts: {
  kind: BetKind;
  candidate: { id: string; number: number; umaName: string } | undefined;
  slot?: string | null;
}): string {
  const { candidate } = opts;
  if (!candidate) return "";
  const params = new URLSearchParams({ kind: opts.kind });
  if (opts.slot === "day" || opts.slot === "dusk" || opts.slot === "night") {
    params.set("slot", opts.slot);
  }
  return `<section class="paddock-candidate" aria-label="パドック候補">
    <div class="paddock-candidate__body"><span class="paddock-candidate__label">パドック候補</span><b>${candidate.number}番 ${escapeHtml(candidate.umaName)}</b></div>
    <a class="paddock-candidate__clear" href="/bet?${params}">候補を外す</a>
  </section>`;
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
  const candidateNumber = candidate?.number ?? null;
  if (candidateNumber != null) picks[0] = candidateNumber;
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
  const buyGuide = document.getElementById("buy-guide");
  if (hintEl) {
    const candidateHint = {
      win: "パドック候補を選択済みにしています。金額を入力してください。",
      umaren: "パドック候補を1枠目に入れています。相手を1頭選んでください。",
      umatan: "パドック候補を1着に入れています。2着を選んでください。",
      sanrenpuku: "パドック候補を1枠目に入れています。残り2頭を選んでください。",
      sanrentan: "パドック候補を1着に入れています。2着・3着を選んでください。",
    };
    hintEl.textContent = candidateNumber == null ? hint : candidateHint[kind];
  }
  const cap = Math.floor(bal / unit) * unit;
  const setAmt = (n) => {
    amount = Math.max(0, Math.min(cap, Math.floor(n / unit) * unit));
    amountInput.value = String(amount);
    paint();
  };
  function ready() {
    return picks.every((x) => x != null) && amount >= unit && amount <= bal;
  }
  function validationMessage() {
    const missing = picks.filter((x) => x == null).length;
    if (missing > 0) return "あと" + missing + "頭選択してください。";
    if (bal < unit) return "残高が足りません（最低" + unit + "スペ必要です）。";
    if (amount < unit) return "購入金額を選んでください（最低" + unit + "スペ）。";
    return null;
  }
  function syncHidden() {
    const ids = picks.map((n) => (n == null ? "" : byNum.get(n)?.id || ""));
    h1.value = ids[0] || "";
    h2.value = ids[1] || "";
    h3.value = ids[2] || "";
    amountInput.value = String(amount);
    buy.disabled = preview;
    if (buyGuide) {
      buyGuide.textContent = preview
        ? "管理者プレビューでは購入できません。"
        : validationMessage() ?? "内容を確認して「買う」を押してください。";
    }
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
    const well = Number(b.dataset.well);
    if (well === 0 && candidateNumber != null) return;
    picks[well] = null;
    paint();
  });
  board.addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    const n = Number(b.dataset.n);
    const i = picks.indexOf(n);
    if (i >= 0) {
      if (i === 0 && candidateNumber != null) return;
      picks[i] = null; paint(); return;
    }
    const hole = picks.findIndex((x) => x == null);
    if (hole >= 0) picks[hole] = n;
    paint();
  });
  document.querySelector(".amt-controls")?.addEventListener("click", (e) => {
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
    const message = validationMessage();
    if (message) {
      ev.preventDefault();
      alert(message);
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
  betOperationId: string;
  redoOperationId: string;
  scripts?: string;
  candidateHorseId?: string | null;
  slot?: string | null;
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
  const candidate = horses.find((horse) => horse.id === opts.candidateHorseId);
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
      <input type="hidden" name="operation_id" value="${escapeHtml(opts.betOperationId)}">
      <input type="hidden" name="candidate" value="${escapeHtml(candidate?.id ?? "")}">
      <input type="hidden" name="slot" value="${escapeHtml(opts.slot ?? "")}">
      <div class="desk-scroll">
        ${flash}
        ${opts.preview ? `<p class="admin-preview">管理者プレビュー：馬券の購入・参加はできません。</p>` : ""}
        ${kindsNavHtml(opts.kind, opts.board.event.enabled_kinds, candidate?.id, opts.slot)}
        ${candidateBarHtml({ kind: opts.kind, candidate, slot: opts.slot })}
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
          <div class="amt-controls">
          <div class="amt-row">
            <button type="button" data-add="100">+100</button>
            <button type="button" data-add="500">+500</button>
            <button type="button" data-add="1000">+1,000</button>
          </div>
          <div class="amt-action-row">
            <button type="button" class="amt-all" data-all>全額を入力</button>
            <button type="button" class="amt-reset" data-set="0">リセット</button>
          </div>
          </div>
          <p class="buy-guide" id="buy-guide" aria-live="polite">買い目と購入金額を選んでください。</p>
        </div>
        <button type="submit" class="buy" id="buy" aria-describedby="buy-guide" ${opts.preview ? "disabled" : ""}>買う</button>
      </div>
    </form>
    <form id="redo-form" method="post" action="/bet/redo" hidden>
      <input type="hidden" name="operation_id" value="${escapeHtml(opts.redoOperationId)}">
    </form>`;
  return pageWrap({
    user: opts.user,
    board: opts.board,
    bodyInner,
    scripts:
      markCardScript({
        kind: opts.kind,
        balance: opts.user.balance,
        unit: opts.board.event.bet_unit,
        horses,
        candidateHorseId: candidate?.id,
        preview: opts.preview,
      }) + (opts.scripts ?? ""),
  });
}
