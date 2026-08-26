import { escapeHtml } from "./http";
import { horseSheetParts } from "./horseName";
import { parseHorseScoreInput, STYLE_OPTIONS } from "./horseScoreInput";
import { scoreFromHorse } from "./scoreFromHorse";
import { eventScoreSetup } from "./store";
import type { Board, EventRow, HorseBoard, UserRow, BetRow } from "./store";
import type { UndoMeta } from "./undo";
import {
  adminOpsGuide,
  comboOddsTable,
  flashHtml,
  formatMove,
  formatOdds,
  formatOddsWithUnit,
  formatPt,
  formulaPanel,
  headerPhaseKind,
  statusLabel,
  strengthCalcModal,
  toJstInput,
} from "./ui";
import { horsesAdminBody, ocrAdminScript } from "./ocrAdmin";
import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  OPTIONAL_BET_KINDS,
  parseEnabledKinds,
  settleBet,
  type BetKind,
} from "./bets";
import {
  DEFAULT_SCORE_REQ,
  GROUND_CONDITION_OPTIONS,
  listScoreCourses,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from "./scoreSetup";

export function adminReauthField(): string {
  return `<div class="autofill-trap" aria-hidden="true">
      <input type="text" tabindex="-1" autocomplete="username">
      <input type="password" tabindex="-1" autocomplete="current-password">
    </div>
    <label>管理者パス
      <input class="no-autofill" name="admin_reauth" type="password" required
        autocomplete="new-password" autocapitalize="off" spellcheck="false"
        data-lpignore="true" data-1p-ignore="true" data-bwignore="true" readonly>
    </label>`;
}

function phasePill(status: EventRow["status"]): string {
  return `<span class="phase ${headerPhaseKind(status)}">${escapeHtml(statusLabel(status))}</span>`;
}

function bindDlgScript(): string {
  return `<script>
(() => {
  const bindDlg = (dlg, openBtn, cancel) => {
    if (dlg && openBtn) openBtn.addEventListener("click", () => dlg.showModal());
    if (dlg && cancel) cancel.addEventListener("click", () => dlg.close());
    if (dlg) {
      dlg.addEventListener("click", (ev) => {
        const r = dlg.getBoundingClientRect();
        const inside =
          ev.clientX >= r.left && ev.clientX <= r.right &&
          ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside) dlg.close();
      });
    }
  };
  ["reset","undo","clear-horses","discard-event","revert-voting","scratch"].forEach((id) => {
    bindDlg(document.getElementById(id + "-modal"), document.getElementById(id + "-open"), document.getElementById(id + "-cancel"));
  });
  const confirmOnSubmit = (form, msg) => {
    if (!form) return;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const dlg = form.closest("dialog");
      if (dlg) dlg.close();
      if (window.confirm(msg)) form.submit();
      else if (dlg) dlg.showModal();
    });
  };
  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    confirmOnSubmit(form, form.getAttribute("data-confirm"));
  });
  document.querySelectorAll("input.no-autofill").forEach((el) => {
    el.addEventListener("focus", () => el.removeAttribute("readonly"));
  });
  const handle = document.getElementById("escape-handle");
  const close = document.getElementById("esc-drawer-close");
  const scrim = document.getElementById("escape-scrim");
  const setOpen = (on) => document.body.toggleAttribute("data-esc-open", on);
  if (handle) handle.addEventListener("click", () => setOpen(!document.body.hasAttribute("data-esc-open")));
  if (close) close.addEventListener("click", () => setOpen(false));
  if (scrim) scrim.addEventListener("click", () => setOpen(false));
})();
</script>`;
}

function escapeDialogs(opts: {
  undoMeta: UndoMeta | null;
  allowDemo: boolean;
  reauth: string;
}): string {
  const u = opts.undoMeta;
  const undoLabel = u ? escapeHtml(u.action_label) : "—";
  const undoWhen = u
    ? escapeHtml(toJstInput(u.created_at).replace("T", " ")) + " JST"
    : "";
  return `
<dialog class="modal" id="clear-horses-modal">
  <h2>出走を空にする</h2>
  <p><strong>この開催の出走をすべて消します。開催自体は残ります。</strong></p>
  <form method="post" action="/admin/clear-horses" class="reauth" autocomplete="off"
    data-confirm="この開催の出走をすべて消します。開催自体は残ります。\\n\\n本当に空にしますか？">
    <div class="row">${opts.reauth}<button class="danger" type="submit">空にする</button>
      <button type="button" class="secondary" id="clear-horses-cancel">やめる</button></div>
  </form>
</dialog>
<dialog class="modal" id="discard-event-modal">
  <h2>この開催を破棄</h2>
  <p><strong>この開催を破棄し、直前の公開済み開催へ戻します。残高は消しません。</strong></p>
  <form method="post" action="/admin/discard-event" class="reauth" autocomplete="off"
    data-confirm="この開催を破棄し、直前の公開済み開催へ戻します。残高は消しません。\\n\\n本当に破棄しますか？">
    <div class="row">${opts.reauth}<button class="danger" type="submit">破棄する</button>
      <button type="button" class="secondary" id="discard-event-cancel">やめる</button></div>
  </form>
</dialog>
<dialog class="modal" id="revert-voting-modal">
  <h2>投票を取り消して登録に戻す</h2>
  <p><strong>投票を止め、出走登録に戻します。この開催の票は全額戻り、配ったスペも戻します。</strong></p>
  <form method="post" action="/admin/revert-voting" class="reauth" autocomplete="off"
    data-confirm="投票を取り消して出走登録に戻します。この開催の票は全額戻り、配ったスペも戻します。\\n\\n本当に戻しますか？">
    <div class="row">${opts.reauth}<button class="danger" type="submit">登録に戻す</button>
      <button type="button" class="secondary" id="revert-voting-cancel">やめる</button></div>
  </form>
</dialog>
<dialog class="modal" id="undo-modal">
  <h2>直前の操作を戻す</h2>
  <p><strong>戻す操作: ${undoLabel}</strong></p>
  <p>出走・票・残高・払戻が、その操作の直前の状態に戻ります。</p>
  <form method="post" action="/admin/undo" class="reauth" autocomplete="off"
    data-confirm="${escapeHtml("直前の管理者操作を巻き戻します。戻す操作: " + (u?.action_label ?? "") + "。本当に巻き戻しますか？")}">
    <div class="row">${opts.reauth}<button class="danger" type="submit">巻き戻す</button>
      <button type="button" class="secondary" id="undo-cancel">やめる</button></div>
  </form>
</dialog>
${
  opts.allowDemo
    ? `<dialog class="modal" id="reset-modal">
  <h2>デモ初期化（ローカルのみ）</h2>
  <form method="post" action="/admin/reset" class="reauth" autocomplete="off"
    data-confirm="デモを初期化します。本当に初期化しますか？">
    <div class="row">${opts.reauth}<button class="danger" type="submit">初期化する</button>
      <button type="button" class="secondary" id="reset-cancel">やめる</button></div>
  </form>
</dialog>`
    : ""
}
<button type="button" class="escape-handle" id="escape-handle">逃げ・復旧</button>
<div class="escape-scrim" id="escape-scrim"></div>
<aside class="escape-drawer" id="escape-drawer">
  <div class="esc-top"><p class="esc-k" style="margin:0">逃げ・復旧</p>
    <button type="button" id="esc-drawer-close" aria-label="閉じる">×</button></div>
  <p class="esc-note">本線ではない。パスと確認が要る。</p>
  <div class="esc-grid">
    <div>
      <p class="esc-k">開催を戻す</p>
      <button type="button" id="clear-horses-open">出走を空にする</button>
      <button type="button" class="danger" id="discard-event-open">この開催を破棄</button>
      <button type="button" class="danger" id="revert-voting-open">投票を取り消して登録に戻す</button>
    </div>
    <div>
      <p class="esc-k">復旧</p>
      ${u ? `<button type="button" class="danger" id="undo-open">操作を戻す</button>` : `<button type="button" disabled>操作を戻す</button>`}
      <p class="esc-note">${u ? `戻せる操作: ${undoLabel}（${undoWhen}）` : "戻せる管理者操作はまだありません。"}</p>
      ${opts.allowDemo ? `<button type="button" id="reset-open">デモ初期化</button>` : ""}
    </div>
  </div>
</aside>`;
}

function placesScript(
  live: { id: string; n: number; uma: string; run: string; place: number | null }[],
): string {
  return `<script>
(() => {
  const LIVE = ${JSON.stringify(live)};
  const N = LIVE.length;
  const places = Array(N).fill(null);
  for (const h of LIVE) {
    if (h.place != null && h.place >= 1 && h.place <= N) places[h.place - 1] = h.id;
  }
  let pick = null;
  const used = () => new Set(places.filter(Boolean));
  const byId = (id) => LIVE.find((h) => h.id === id);
  function syncHidden() {
    for (const h of LIVE) {
      const el = document.getElementById("place-in-" + h.id);
      const i = places.indexOf(h.id);
      if (el) el.value = i >= 0 ? String(i + 1) : "";
    }
  }
  function horseEl(id) {
    const h = byId(id);
    const on = pick === id ? " on" : "";
    return '<div class="horse' + on + '" draggable="true" data-id="' + h.id + '"><span class="n">' + h.n + '</span><span class="uma">' + h.uma + '</span><span class="run">' + h.run + '</span></div>';
  }
  function paint() {
    const idle = LIVE.filter((h) => !used().has(h.id));
    const mid = Math.ceil(Math.max(N, 1) / 2);
    const left = document.getElementById("place-idle");
    const ranks = document.getElementById("place-ranks");
    if (left) left.innerHTML = idle.map((h) => horseEl(h.id)).join("") || '<span class="note">なし</span>';
    if (ranks) {
      ranks.style.gridTemplateRows = "repeat(" + mid + ", auto)";
      ranks.innerHTML = places.map((id, i) =>
        '<div class="rank-row"><div class="rk-n">' + (i + 1) + '着</div><div class="slot' + (id ? " fill" : "") + '" data-slot="' + i + '">' +
        (id ? horseEl(id) : '<span class="note">ここに置く</span>') + "</div></div>"
      ).join("");
    }
    syncHidden();
    bind();
  }
  function setPlace(i, id) {
    const prev = places.indexOf(id);
    if (prev >= 0) places[prev] = null;
    places[i] = id;
    pick = null;
    paint();
  }
  function bind() {
    document.querySelectorAll("#place-board .horse").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const id = el.dataset.id;
        const inSlot = el.closest("[data-slot]");
        if (inSlot && !pick) { places[Number(inSlot.dataset.slot)] = null; paint(); return; }
        if (used().has(id) && pick == null) {
          const i = places.indexOf(id);
          if (i >= 0) { places[i] = null; paint(); }
          return;
        }
        const hole = places.findIndex((x) => x == null);
        if (hole >= 0 && !used().has(id)) { setPlace(hole, id); return; }
        pick = pick === id ? null : id;
        paint();
      });
      el.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", el.dataset.id); });
    });
    document.querySelectorAll("#place-board [data-slot]").forEach((slot) => {
      slot.addEventListener("click", () => { if (pick) setPlace(Number(slot.dataset.slot), pick); });
      slot.addEventListener("dragover", (e) => { e.preventDefault(); slot.classList.add("drop"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("drop"));
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("drop");
        const id = e.dataTransfer.getData("text/plain");
        if (id) setPlace(Number(slot.dataset.slot), id);
      });
    });
  }
  paint();
})();
</script>`;
}

function progressWork(board: Board, recentHtml: string): string {
  const e = board.event;
  const live = board.horses.filter((h) => !h.horse.scratched);
  if (e.status === "setup") {
    const rows = board.horses
      .map((h) => {
        const p = horseSheetParts(h.horse);
        const man = h.horse.seed_source === "manual";
        return `<tr class="${h.horse.scratched ? "scr" : ""}"><td>${h.number}</td><td>${escapeHtml(p.umaName)}</td><td>${escapeHtml(p.runnerName)}</td><td>${h.horse.strength}</td><td>${man ? `<span class="tag warn">直置き</span>` : `<span class="tag">自動</span>`}</td></tr>`;
      })
      .join("");
    return `<section class="work"><h2>出走の要約</h2>
      <p class="note">進行には名簿だけ。読取と直置きの編集は出走登録。</p>
      <table class="plain"><thead><tr><th>#</th><th>ウマ娘</th><th>出走者</th><th>評価点</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="muted">まだいません</td></tr>`}</tbody></table>
      <a class="more-link" href="/admin/register">出走登録へ</a></section>`;
  }
  if (e.status === "voting") {
    const rows = live
      .map((h) => {
        const p = horseSheetParts(h.horse);
        return `<div class="mini-row"><span class="n">${h.number}</span><span class="uma">${escapeHtml(p.umaName)}</span><span class="run">${escapeHtml(p.runnerName)}</span><span class="od">${formatOdds(h.referenceOdds)}</span></div>`;
      })
      .join("");
    const mid = Math.ceil(Math.max(live.length, 1) / 2);
    return `<section class="work"><h2>投票のいま</h2>
      <div class="work-split">
        <div><p class="col-h">単勝 · 参考</p>
          <div class="mini-grid" style="grid-template-rows:repeat(${mid},auto)">${rows}</div>
          <a class="more-link" href="/admin/odds">オッズタブへ</a></div>
        <div><p class="col-h">直近の票</p>${recentHtml}<a class="more-link" href="/admin/ledger">台帳へ</a></div>
      </div></section>`;
  }
  const payload = live.map((h) => {
    const p = horseSheetParts(h.horse);
    return { id: h.horse.id, n: h.number, uma: p.umaName, run: p.runnerName, place: h.horse.finish_place };
  });
  const hidden = live
    .map((h) => `<input type="hidden" form="places-form" name="place_${h.horse.id}" id="place-in-${h.horse.id}" value="${h.horse.finish_place ?? ""}">`)
    .join("");
  const save =
    e.status === "closed"
      ? `<form id="places-form" method="post" action="/admin/places"></form>${hidden}
         <p class="note">一般画面には着順を出しません。公開まで。</p>
         <div class="ctas">
           <button form="places-form" type="submit">着順を保存</button>
           <form method="post" action="/admin/publish" onsubmit="return confirm(${escapeHtml(JSON.stringify("結果を公開して払戻します。着順が一般に出ます。よろしいですか？"))});">
             <button type="submit">結果を公開して払戻する</button>
           </form>
         </div>`
      : hidden;
  return `<section class="work" id="place-board"><h2>${e.status === "published" ? "確定着順" : "着順"}</h2>
    <p class="note">左が未着順、右は上から折る2列。タップかドラッグ。</p>
    <div class="split"${e.status === "published" ? ` style="grid-template-columns:1fr"` : ""}>
      ${e.status === "published" ? "" : `<div><p class="col-h">未着順</p><div class="stack" id="place-idle"></div></div>`}
      <div><p class="col-h">${e.status === "published" ? "確定着順" : "着順"}</p>
        <div class="ranks-cols" id="place-ranks"></div></div>
    </div>
    ${save}
    ${placesScript(payload)}
  </section>`;
}

export function adminProgressPage(opts: {
  board: Board;
  undoMeta: UndoMeta | null;
  allowDemo: boolean;
  memberCount: number;
  betCount: number;
  recentBetsHtml: string;
}): { body: string; afterDash: string; scripts: string } {
  const e = opts.board.event;
  const liveCount = opts.board.horses.filter((h) => !h.horse.scratched).length;
  const ops = adminOpsGuide(opts.board);
  const close = toJstInput(e.voting_closes_at);
  const body = `<section class="hero">
      <div class="hero-top"><h1>${escapeHtml(e.title)}</h1>${phasePill(e.status)}</div>
      <div class="kpis">
        <div class="kpi"><span class="k">頭数</span><span class="v">${liveCount}</span></div>
        <div class="kpi"><span class="k">締切</span><span class="v">${close ? escapeHtml(close.replace("T", " ")) + " JST" : "—"}</span></div>
        <div class="kpi"><span class="k">参加者</span><span class="v">${e.status === "setup" ? "—" : opts.memberCount}</span></div>
        <div class="kpi"><span class="k">票</span><span class="v">${opts.betCount}</span></div>
      </div>
      <div class="ops-pair">
        <div><div class="ops-k">いまのフェーズ</div>${phasePill(e.status)}</div>
        <div><div class="ops-k">次に必要な操作</div><p class="ops-next">${escapeHtml(ops.next)}</p></div>
      </div>
      <div class="ctas">
        <form method="post" action="/admin/open" onsubmit="return confirm(${escapeHtml(JSON.stringify("投票を開始します。このあと出走の追加はできません。よろしいですか？"))});">
          <button type="submit"${e.status !== "setup" ? " disabled" : ""}>投票開始</button>
        </form>
        <form method="post" action="/admin/close" onsubmit="return confirm(${escapeHtml(JSON.stringify("強制締切します。投票を止め、確定配当に切り替えます。よろしいですか？"))});">
          <button class="danger" type="submit"${e.status !== "voting" ? " disabled" : ""}>強制締切</button>
        </form>
        <form method="post" action="/admin/next-event" onsubmit="return confirm(${escapeHtml(JSON.stringify("次の開催を開きます。いまの結果は残し、新しい出走登録に入ります。よろしいですか？"))});">
          <button type="submit"${e.status !== "published" ? " disabled" : ""}>次の開催を開く</button>
        </form>
      </div>
    </section>
    ${progressWork(opts.board, opts.recentBetsHtml)}`;
  return {
    body,
    afterDash: escapeDialogs({
      undoMeta: opts.undoMeta,
      allowDemo: opts.allowDemo,
      reauth: adminReauthField(),
    }),
    scripts: bindDlgScript(),
  };
}

export function adminRegisterPage(
  board: Board,
  editId: string | null,
): { body: string; scripts: string } {
  const setup = eventScoreSetup(board.event);
  const canSetup = board.event.status === "setup";
  const edit = editId ? board.horses.find((h) => h.horse.id === editId) : null;
  const list = board.horses
    .map((h) => {
      const p = horseSheetParts(h.horse);
      const on = edit?.horse.id === h.horse.id ? " on" : "";
      const man = h.horse.seed_source === "manual";
      return `<a class="reg-row${on}" href="/admin/register?edit=${escapeHtml(h.horse.id)}">
        <span class="n">${h.number}</span>
        <span class="who"><span class="uma">${escapeHtml(p.umaName)}</span><span class="run">${escapeHtml(p.runnerName)}</span></span>
        <span class="tag${man ? " warn" : ""}">${man ? "直置き" : "自動"}</span>
      </a>`;
    })
    .join("");
  let bench = horsesAdminBody(board, canSetup, setup, { embedded: true });
  if (canSetup && edit && !edit.horse.scratched) {
    const p = horseSheetParts(edit.horse);
    const scoreIn = parseHorseScoreInput(edit.horse.score_input);
    const styleOpts = STYLE_OPTIONS.map((o) => {
      const sel = scoreIn?.styleKey === o.key ? " selected" : "";
      return `<option value="${o.key}"${sel}>${o.label}</option>`;
    }).join("");
    const shot = edit.horse.shot_key
      ? `<button type="button" class="shot-thumb" id="shot-open"><img src="/admin/shot/${escapeHtml(edit.horse.id)}" alt=""></button>`
      : `<p class="note">スクショなし</p>`;
    bench = `<h2>直し · ${escapeHtml(p.umaName)}</h2>
      <form method="post" action="/admin/horse-edit" class="row">
        <input type="hidden" name="horse_id" value="${escapeHtml(edit.horse.id)}">
        <label>ウマ娘名 <input name="uma_name" value="${escapeHtml(p.umaName)}" required maxlength="40"></label>
        <label>出走者 <input name="runner_name" value="${escapeHtml(p.runnerName)}" required maxlength="40"></label>
        <label>出走脚質 <select name="style_key"><option value="">未選択</option>${styleOpts}</select></label>
        <label>評価点 <input name="strength" type="number" min="0" step="0.1" value="${edit.horse.strength}" required></label>
        <label class="kind-opt"><input type="checkbox" name="strength_manual" value="1"${edit.horse.seed_source === "manual" ? " checked" : ""}> 評価点を直置き</label>
        <button type="submit">更新</button>
      </form>
      <p class="note"><a href="/admin/register">次の1頭を登録する</a></p>${shot}`;
  }
  const body = `<section class="hero">
      <div class="hero-top"><h1>出走登録</h1>${phasePill(board.event.status)}<span>${board.horses.length} / 18</span></div>
      <p class="note">1頭ずつ。完成スクショを読んで登録するか、スクショなしの直置き。掛かりスタミナ2欄はまだ置かない。</p>
    </section>
    <div class="register-desk">
      <section class="work"><div class="work-head"><h2>名簿</h2></div>
        <div class="reg-list">${list || `<p class="note">まだいません</p>`}</div></section>
      <section class="work">${bench}</section>
    </div>
    ${strengthCalcModal()}
    <dialog class="shot-dlg" id="shot-dlg"><div class="shot-scroller fit" id="shot-scroller"><img id="shot-full" alt=""></div></dialog>
    <script>
      const dlg = document.getElementById("shot-dlg");
      const full = document.getElementById("shot-full");
      const sc = document.getElementById("shot-scroller");
      document.getElementById("shot-open")?.addEventListener("click", () => {
        const img = document.querySelector("#shot-open img");
        if (full && img) full.src = img.getAttribute("src") || "";
        dlg?.showModal();
      });
      sc?.addEventListener("dblclick", () => { sc.classList.toggle("fit"); sc.classList.toggle("read"); });
      dlg?.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
    </script>`;
  return { body, scripts: canSetup && !edit ? ocrAdminScript(!!setup) : "" };
}

function styleLabel(key: string | null | undefined): string {
  return STYLE_OPTIONS.find((x) => x.key === key)?.label ?? "—";
}

function pipeHtml(h: HorseBoard, board: Board): string {
  const p = horseSheetParts(h.horse);
  const input = parseHorseScoreInput(h.horse.score_input);
  const setup = eventScoreSetup(board.event);
  const auto = scoreFromHorse(setup, input);
  const shot = h.horse.shot_key
    ? `<button type="button" class="shot-thumb" data-shot="/admin/shot/${escapeHtml(h.horse.id)}"><img src="/admin/shot/${escapeHtml(h.horse.id)}" alt=""></button>`
    : `<div class="shot-none">スクショなし</div>`;
  const head = `<div class="pipe-head"><div><h2>${h.number} ${escapeHtml(p.umaName)}</h2>
    <p class="note">${escapeHtml(p.runnerName)} · ${escapeHtml(styleLabel(input?.styleKey))}</p></div>${shot}</div>`;
  if (h.horse.seed_source === "manual" || !auto) {
    const why = h.horse.seed_source === "manual" ? "直置きチェック。手入力が Seed に使われる。" : "算出不能。直置きが正。";
    return `${head}<div class="pipe-step"><div class="pipe-k">経路</div><div>直置き。${why}</div></div>
      <div class="pipe-step"><div class="pipe-k">評価点（Seed の比）</div><div class="pipe-final">${h.horse.strength}</div></div>
      <p class="note">直しは出走登録。</p>`;
  }
  const b = auto.breakdown;
  const s = b.skill;
  const g = b.green;
  const bits = [g.speed && `速+${g.speed}`, g.stamina && `スタ+${g.stamina}`, g.power && `パ+${g.power}`, g.guts && `根+${g.guts}`, g.wisdom && `賢+${g.wisdom}`].filter(Boolean);
  return `${head}
    <div class="pipe-step"><div class="pipe-k">土台（スキル）</div>
      <div>有効 ${s.effectiveCount} ＋ 金×2（${s.goldCount}枚）＋ ためらい ${s.tameraiCount}＝ <b>${s.base}</b></div></div>
    <div class="pipe-step"><div class="pipe-k">緑 → ステへ</div><div>${escapeHtml(bits.join(" ") || "なし")}</div></div>
    <div class="pipe-step"><div class="pipe-k">スピード</div><div>r=${b.ratios.speed.toFixed(2)}</div></div>
    <div class="pipe-step"><div class="pipe-k">スタミナ</div><div>×${b.ratios.staminaMult.toFixed(2)}</div></div>
    <div class="pipe-step"><div class="pipe-k">パワー</div><div>r=${b.ratios.power.toFixed(2)}</div></div>
    <div class="pipe-step"><div class="pipe-k">根性</div><div>r=${b.ratios.guts.toFixed(2)}</div></div>
    <div class="pipe-step"><div class="pipe-k">賢さ</div><div>r=${b.ratios.wisdom.toFixed(2)}</div></div>
    <div class="pipe-step"><div class="pipe-k">評価点 → Seed</div>
      <div class="pipe-final">${h.horse.strength}</div>
      <p class="pipe-eq">Seed ${Math.round(h.seed).toLocaleString("ja-JP")}</p></div>`;
}

export function adminHorsesPage(board: Board, selId: string | null, reauth: string): string {
  const first = board.horses[0]?.horse.id ?? "";
  const sel = selId && board.horses.some((h) => h.horse.id === selId) ? selId : first;
  const rows = board.horses
    .map((h) => {
      const p = horseSheetParts(h.horse);
      const input = parseHorseScoreInput(h.horse.score_input);
      const man = h.horse.seed_source === "manual";
      const on = h.horse.id === sel ? " on" : "";
      const scratch =
        board.event.status !== "published" && !h.horse.scratched
          ? `<button type="button" class="danger" data-scratch-id="${escapeHtml(h.horse.id)}" data-scratch-name="${escapeHtml(p.umaName)}（${escapeHtml(p.runnerName)}）">取消</button>`
          : h.horse.scratched ? "取消済" : "";
      return `<tr data-id="${escapeHtml(h.horse.id)}" class="${on}${h.horse.scratched ? " scr" : ""}">
        <td>${h.number}</td><td>${escapeHtml(p.umaName)}</td><td>${escapeHtml(p.runnerName)}</td>
        <td>${escapeHtml(styleLabel(input?.styleKey))}</td>
        <td class="num">${h.horse.strength}</td>
        <td>${man ? `<span class="tag warn">直置き</span>` : `<span class="tag">自動</span>`}</td>
        <td class="num">${Math.round(h.seed).toLocaleString("ja-JP")}</td>
        <td>${scratch}</td></tr>`;
    })
    .join("");
  const current = board.horses.find((h) => h.horse.id === sel) ?? board.horses[0];
  const pipe = current ? pipeHtml(current, board) : `<p class="note">まだいません</p>`;
  return `<section class="hero"><div class="hero-top"><h1>出走</h1>${phasePill(board.event.status)}</div>
      <p class="note">評価点はメンバーに出さない。行を選ぶと掛け算の内訳。OCRと直置きの編集は出走登録。</p></section>
    <div class="horses-desk">
      <section class="work"><h2>名簿</h2>
        <table class="plain" id="roster"><thead><tr>
          <th>#</th><th>ウマ娘</th><th>出走者</th><th>脚質</th><th>評価点</th><th></th><th>Seed</th><th></th>
        </tr></thead><tbody>${rows || `<tr><td colspan="8">まだいません</td></tr>`}</tbody></table>
      </section>
      <aside class="work pipe">${pipe}</aside>
    </div>
    <dialog class="shot-dlg" id="shot-dlg"><div class="shot-scroller fit" id="shot-scroller"><img id="shot-full" alt=""></div></dialog>
    <dialog class="modal" id="scratch-modal">
      <h2>出走取消</h2>
      <p id="scratch-p"></p>
      <form method="post" action="/admin/scratch" id="scratch-form" class="reauth" autocomplete="off"
        data-confirm="このウマ娘を出走取消し、含む馬券を全額返還します。よろしいですか？">
        <input type="hidden" name="horse_id" id="scratch-horse-id">
        <div class="row">${reauth}<button class="danger" type="submit">取消・返還</button>
          <button type="button" class="secondary" id="scratch-cancel">やめる</button></div>
      </form>
    </dialog>
    ${bindDlgScript()}
    <script>
      document.querySelectorAll("#roster tr[data-id]").forEach((tr) => {
        tr.addEventListener("click", (ev) => {
          if (ev.target.closest("button")) return;
          location.href = "/admin/horses?sel=" + encodeURIComponent(tr.dataset.id);
        });
      });
      const dlg = document.getElementById("shot-dlg");
      const full = document.getElementById("shot-full");
      document.querySelectorAll("[data-shot]").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (full) full.src = btn.getAttribute("data-shot") || "";
          dlg?.showModal();
        });
      });
      const sdlg = document.getElementById("scratch-modal");
      document.querySelectorAll("[data-scratch-id]").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          document.getElementById("scratch-horse-id").value = btn.getAttribute("data-scratch-id");
          document.getElementById("scratch-p").textContent = "「" + btn.getAttribute("data-scratch-name") + "」を出走取消します。";
          sdlg?.showModal();
        });
      });
    </script>`;
}

export function adminLedgerPage(opts: {
  board: Board;
  members: UserRow[];
  betRows: string;
  betOrder: "new" | "name";
}): string {
  const memberRows = opts.members
    .map((u) => `<tr><td>${escapeHtml(u.display_name)}</td><td class="num">${formatPt(u.balance)}</td></tr>`)
    .join("");
  return `<section class="hero"><div class="hero-top"><h1>台帳</h1>${phasePill(opts.board.event.status)}</div>
      <p class="note">左が口座、右が馬券。板はオッズタブ。</p></section>
    <div class="ledger-desk">
      <section class="work">
        <div class="work-head"><h2>残高</h2>
          <button type="button" class="secondary" id="member-del-open">メンバー削除</button></div>
        <table class="plain"><thead><tr><th>名前</th><th class="num">残高</th></tr></thead>
          <tbody>${memberRows || `<tr><td colspan="2" class="muted">まだいません</td></tr>`}</tbody></table>
        <dialog class="modal" id="member-del-modal">
          <h2>メンバー削除</h2>
          <form method="post" action="/admin/member-delete" id="member-del-form">
            <div class="row">
              <label>削除する人
                <select name="user_id" id="member-del-select" required>
                  <option value="">—</option>
                  ${opts.members.map((u) => `<option value="${escapeHtml(u.id)}" data-name="${escapeHtml(u.display_name)}">${escapeHtml(u.display_name)}（${formatPt(u.balance)}）</option>`).join("")}
                </select>
              </label>
              <button class="danger" type="submit">削除する</button>
              <button type="button" class="secondary" id="member-del-cancel">やめる</button>
            </div>
          </form>
        </dialog>
      </section>
      <section class="work">
        <div class="work-head"><h2>全投票</h2>
          <p class="sort-links">
            <a href="/admin/ledger?bets=new" class="${opts.betOrder === "new" ? "on" : ""}">新しい順</a> ·
            <a href="/admin/ledger?bets=name" class="${opts.betOrder === "name" ? "on" : ""}">名前順</a>
          </p>
        </div>
        <div class="filters">
          <label>賭式 <select id="f-kind"><option value="">すべて</option>
            <option value="win">単勝</option><option value="umaren">馬連</option><option value="umatan">馬単</option>
            <option value="sanrenpuku">3連複</option><option value="sanrentan">3連単</option></select></label>
          <label>結果 <select id="f-res"><option value="">すべて</option>
            <option value="pending">未確定</option><option value="hit">的中</option><option value="miss">外れ</option>
            <option value="special">特払い</option><option value="refund">取消</option></select></label>
          <label>誰 <select id="f-who"><option value="">全員</option>
            ${opts.members.map((u) => `<option>${escapeHtml(u.display_name)}</option>`).join("")}
          </select></label>
        </div>
        <table class="plain" id="bets-table"><thead><tr><th>誰</th><th>賭式</th><th>組み合わせ</th><th>額</th><th>結果</th><th>確定配当</th><th>収支</th></tr></thead>
          <tbody>${opts.betRows || `<tr><td colspan="7" class="muted">なし</td></tr>`}</tbody></table>
      </section>
    </div>
    <script>
      const dlg = document.getElementById("member-del-modal");
      document.getElementById("member-del-open")?.addEventListener("click", () => dlg?.showModal());
      document.getElementById("member-del-cancel")?.addEventListener("click", () => dlg?.close());
      const form = document.getElementById("member-del-form");
      const sel = document.getElementById("member-del-select");
      form?.addEventListener("submit", (ev) => {
        const opt = sel?.options[sel.selectedIndex];
        const name = opt && opt.value ? (opt.getAttribute("data-name") || "") : "";
        if (!name) { ev.preventDefault(); return; }
        if (!confirm("「" + name + "」を削除します。この人の馬券も消えます。よろしいですか？")) ev.preventDefault();
      });
      const kind = document.getElementById("f-kind");
      const res = document.getElementById("f-res");
      const who = document.getElementById("f-who");
      const apply = () => {
        document.querySelectorAll("#bets-table tbody tr[data-kind]").forEach((tr) => {
          tr.hidden = !((!kind.value || tr.dataset.kind === kind.value) && (!res.value || tr.dataset.res === res.value) && (!who.value || tr.dataset.who === who.value));
        });
      };
      kind?.addEventListener("change", apply);
      res?.addEventListener("change", apply);
      who?.addEventListener("change", apply);
    </script>`;
}

export function adminOddsPage(board: Board): string {
  const kinds: { kind: BetKind; area: string; label: string }[] = [
    { kind: "win", area: "win", label: "単勝" },
    { kind: "umaren", area: "q", label: "馬連" },
    { kind: "umatan", area: "e", label: "馬単" },
    { kind: "sanrenpuku", area: "t", label: "3連複" },
    { kind: "sanrentan", area: "f", label: "3連単" },
  ];
  const panels = kinds
    .map((k) => `<section class="work odds-panel odds-panel-${k.area}"><div class="work-head"><h2>${k.label}</h2>
          <span class="note">${board.event.status === "voting" || board.event.status === "setup" ? "参考" : "確定"}</span></div>
          ${comboOddsTable(board, k.kind)}</section>`)
    .join("");
  return `<section class="hero odds-hero">
      <div class="hero-top"><h1>オッズ</h1>${phasePill(board.event.status)}</div>
      <button type="button" class="secondary" id="formula-open">内部計算</button>
    </section>
    <p class="note">5賭式を同時に出す。単勝は全頭、連勝は実票がある買い目だけ。評価点・Seed は出さない。</p>
    <div class="odds-desk">${panels}</div>
    <dialog class="modal" id="formula-modal">
      <h2>内部計算</h2>
      ${formulaPanel(board)}
      <form method="dialog"><button type="submit">閉じる</button></form>
    </dialog>
    <script>
      document.getElementById("formula-open")?.addEventListener("click", () => document.getElementById("formula-modal")?.showModal());
    </script>`;
}

function setSegHtml(
  name: string,
  options: ReadonlyArray<{ value: number; label: string }>,
  selected: number | null | undefined,
): string {
  const cur = selected == null ? "" : String(selected);
  const hidden = `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(cur)}">`;
  const btns = options
    .map((o) => {
      const v = String(o.value);
      return `<button type="button"${v === cur ? ` class="on"` : ""} data-v="${escapeHtml(v)}">${escapeHtml(o.label)}</button>`;
    })
    .join("");
  return `<div class="set-seg" data-seg="${escapeHtml(name)}">${hidden}${btns}</div>`;
}

export function adminSettingsPage(
  board: Board,
  flash?: { text: string | null; error: boolean },
): { body: string; scripts: string } {
  const e = board.event;
  const setup = eventScoreSetup(e);
  const c = setup?.conditions;
  const r = setup?.requirements;
  const canKinds = e.status === "setup";
  const enabled = new Set(parseEnabledKinds(e.enabled_kinds));
  const kindsNote = canKinds
    ? "開始前だけ変えられる。単勝は外せない。"
    : `開始後はロック。いま有効なのは ${escapeHtml(
        parseEnabledKinds(e.enabled_kinds)
          .map((k) => BET_KIND_LABEL[k])
          .join("、"),
      )}。`;
  const kindTogs = [
    `<button type="button" class="set-tog on" disabled>単勝<span class="st">必須</span></button>
     <input type="hidden" name="kind_win" value="1">`,
    ...OPTIONAL_BET_KINDS.map((k) => {
      const on = enabled.has(k);
      const dis = canKinds ? "" : " disabled";
      return `<button type="button" class="set-tog${on ? " on" : ""}" data-kind="${k}"${dis}>${escapeHtml(BET_KIND_LABEL[k])}<span class="st">${on ? "使う" : "使わない"}</span></button>
        <input type="checkbox" name="kind_${k}" value="1"${on ? " checked" : ""}${dis} hidden>`;
    }),
  ].join("");
  const courses = [
    `<option value="">未設定（直置きのみ）</option>`,
    ...listScoreCourses().map((x) => {
      const sel = c?.courseKey === x.courseKey ? " selected" : "";
      return `<option value="${escapeHtml(x.courseKey)}"${sel}>${escapeHtml(x.label)}</option>`;
    }),
  ].join("");
  const num = (n: number | undefined) => (n == null ? "" : String(n));
  const reqVal = (saved: number | undefined, fallback: number) =>
    escapeHtml(saved == null ? String(fallback) : String(saved));
  const ids = setup?.effectiveSkillIds;
  const skillsMeta = ids
    ? `<span class="odds-meta">有効スキル取得済み　逃 ${ids.runner.length} · 先 ${ids.leader.length} · 差 ${ids.betweener.length} · 追 ${ids.chaser.length}</span>`
    : "";
  const stamOn = !!r?.staminaRace;
  const flashEl = flash?.text
    ? `<p class="settings-flash${flash.error ? " err" : ""}">${escapeHtml(flash.text)}</p>`
    : "";
  const body = `<section class="hero settings-hero">
      <div class="hero-top">
        <h1>開催設定</h1>${phasePill(e.status)}
        <div class="ctas"><button type="submit" class="primary" form="settings-form">保存</button></div>
      </div>
      ${flashEl}
    </section>
    <form class="settings-desk" id="settings-form" method="post" action="/admin/params">
      <div class="settings-top">
        <section class="work">
          <p class="set-k">イベント概要</p>
          <input class="set-title" name="title" value="${escapeHtml(e.title)}" aria-label="タイトル">
          <div class="set-row">
            <div class="set-field">
              <span class="k">締切（JST）</span>
              <input name="closes_at" type="datetime-local" value="${toJstInput(e.voting_closes_at)}">
            </div>
            <div class="set-field set-quiet">
              <span class="k">参加 G</span>
              <input name="grant_g" type="number" min="0" step="1" value="${e.grant_g}">
            </div>
            <div class="set-field set-quiet">
              <span class="k">単位</span>
              <input name="bet_unit" type="number" min="1" step="1" value="${e.bet_unit}">
            </div>
          </div>
        </section>
        <section class="work">
          <p class="set-k">賭式</p>
          <p class="set-lock">${kindsNote}</p>
          <div class="set-togs${canKinds ? "" : " locked"}">${kindTogs}</div>
        </section>
      </div>
      <section class="work settings-mid">
        <div class="work-head">
          <h2>レギュレーション</h2>
          ${skillsMeta}
        </div>
        <div class="settings-scroll">
          <p class="set-k">コース</p>
          <select class="set-course" name="score_course" aria-label="コース">${courses}</select>
          <div class="set-conds">
            <div>
              <p class="set-k">天候</p>
              ${setSegHtml("score_weather", WEATHER_OPTIONS, c?.weather)}
            </div>
            <div>
              <p class="set-k">バ場</p>
              ${setSegHtml("score_ground_condition", GROUND_CONDITION_OPTIONS, c?.groundCondition)}
            </div>
            <div>
              <p class="set-k">季節</p>
              ${setSegHtml("score_season", SEASON_OPTIONS, c?.season)}
            </div>
          </div>
          <p class="set-k" style="margin-top:1rem">目標ステ</p>
          <div class="set-targets">
            <label class="set-target"><span class="k">速</span><input name="score_speed_cap" type="number" min="1" value="${reqVal(r?.speedCap, DEFAULT_SCORE_REQ.speedCap)}"></label>
            <label class="set-target"><span class="k">パ</span><input name="score_power" type="number" min="1" value="${reqVal(r?.power, DEFAULT_SCORE_REQ.power)}"></label>
            <label class="set-target"><span class="k">根</span><input name="score_guts" type="number" min="1" value="${reqVal(r?.guts, DEFAULT_SCORE_REQ.guts)}"></label>
            <label class="set-target"><span class="k">賢</span><input name="score_wisdom" type="number" min="1" value="${reqVal(r?.wisdom, DEFAULT_SCORE_REQ.wisdom)}"></label>
            <label class="set-target"><span class="k">スタ · 掛かりなし</span><input name="score_stamina_no" type="number" min="1" value="${escapeHtml(num(r?.staminaNoTempt))}"></label>
            <label class="set-target"><span class="k">スタ · 掛かりあり</span><input name="score_stamina_with" type="number" min="1" value="${escapeHtml(num(r?.staminaWithTempt))}"></label>
          </div>
          <div class="set-flag">
            <input type="hidden" name="score_stamina_race" id="stamina-race" value="${stamOn ? "1" : ""}">
            <button type="button" id="stamina-btn"${stamOn ? ` class="on"` : ""}>${stamOn ? "スタミナ勝負コース" : "スタミナ勝負ではない"}</button>
          </div>
        </div>
      </section>
      <section class="work settings-bot">
        <div class="work-head">
          <h2>参考オッズの数字</h2>
        </div>
        <div class="set-metrics">
          <label class="set-metric">
            <span class="sym">S</span>
            <span class="k">Seed の山</span>
            <input name="seed_pool_s" type="number" min="0" value="${e.seed_pool_s}">
            <span class="d">評価点の比で配る</span>
          </label>
          <label class="set-metric">
            <span class="sym">E</span>
            <span class="k">票量の目安</span>
            <input name="pull_e" type="number" min="0" value="${e.pull_e}">
            <span class="d">票量が近づくと Seed が薄くなる</span>
          </label>
          <label class="set-metric">
            <span class="sym">D</span>
            <span class="k">控除（0〜0.99）</span>
            <input name="takeout_d" type="number" min="0" max="0.99" step="0.01" value="${e.takeout_d}">
            <span class="d">参考も確定も同じ率</span>
          </label>
          <label class="set-metric">
            <span class="sym">w時</span>
            <span class="k">時間の下限</span>
            <input name="w_time_floor" type="number" min="0" max="0.99" step="0.05" value="${e.w_time_floor}">
          </label>
          <label class="set-metric">
            <span class="sym">指数</span>
            <span class="k">時間の曲線</span>
            <input name="w_time_exp" type="number" min="0.2" max="4" step="0.1" value="${e.w_time_exp}">
          </label>
        </div>
      </section>
    </form>`;
  const scripts = `<script>
    document.querySelectorAll(".set-seg").forEach((seg) => {
      seg.querySelectorAll("button").forEach((b) => {
        b.addEventListener("click", () => {
          seg.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
          b.classList.add("on");
          const inp = seg.querySelector("input");
          if (inp) inp.value = b.dataset.v || "";
        });
      });
    });
    const stamBtn = document.getElementById("stamina-btn");
    const stamIn = document.getElementById("stamina-race");
    stamBtn?.addEventListener("click", () => {
      const on = stamIn && stamIn.value !== "1";
      if (stamIn) stamIn.value = on ? "1" : "";
      stamBtn.classList.toggle("on", !!on);
      stamBtn.textContent = on ? "スタミナ勝負コース" : "スタミナ勝負ではない";
    });
    document.querySelectorAll(".set-tog[data-kind]").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.disabled) return;
        const id = b.getAttribute("data-kind");
        const cb = document.querySelector('input[name="kind_' + id + '"]');
        if (!cb) return;
        cb.checked = !cb.checked;
        b.classList.toggle("on", cb.checked);
        const st = b.querySelector(".st");
        if (st) st.textContent = cb.checked ? "使う" : "使わない";
      });
    });
  </script>`;
  return { body, scripts };
}

export function adminLoginBody(flash: { text: string | null; error: boolean }): string {
  return `${flash.text ? flashHtml(flash.text, flash.error) : ""}
    <section class="work">
      <h1>管理者ログイン</h1>
      <form method="post" action="/admin/login">
        <div class="row">
          <label>仮パスワード <input name="password" type="password" required></label>
          <button type="submit">管理画面へ</button>
        </div>
      </form>
    </section>`;
}

export function betRowHtml(
  b: BetRow & { display_name: string },
  board: Board,
  nums: Map<string, number>,
  payByBet: Map<string, { bet_id: string; amount: number; kind: string }>,
): string {
  const e = board.event;
  const label = formatSelectionLabel(b.kind, b.horse_1, b.horse_2, b.horse_3, nums);
  const pool = board.pools.find((p) => p.kind === b.kind);
  const combo = pool?.combos.find((c) => c.selection_key === b.selection_key);
  const settled = settleBet({
    amount: b.amount,
    refunded: !!b.refunded,
    status: e.status,
    payout: payByBet.get(b.id) ?? null,
    comboOdds: combo?.odds ?? null,
    kindVoid: pool?.voidSpecial ?? null,
  });
  let res = "pending";
  if (b.refunded) res = "refund";
  else if (settled.result.includes("特払")) res = "special";
  else if (settled.result.includes("的中")) res = "hit";
  else if (e.status === "published") res = "miss";
  const moveClass =
    settled.move != null && settled.move > 0 ? "move-plus" : settled.move != null && settled.move < 0 ? "move-minus" : "";
  return `<tr class="${b.refunded ? "scr" : ""}" data-kind="${escapeHtml(b.kind)}" data-res="${res}" data-who="${escapeHtml(b.display_name)}">
    <td>${escapeHtml(b.display_name)}</td>
    <td>${escapeHtml(BET_KIND_LABEL[b.kind])}</td>
    <td>${escapeHtml(label)}</td>
    <td class="num">${formatPt(b.amount)}</td>
    <td>${escapeHtml(settled.result)}</td>
    <td class="num">${formatOddsWithUnit(settled.odds)}</td>
    <td class="num ${moveClass}">${formatMove(settled.move)}</td>
  </tr>`;
}

export function recentBetsHtml(
  bets: (BetRow & { display_name: string })[],
  board: Board,
  nums: Map<string, number>,
): string {
  const rows = bets.slice(0, 8)
    .map((b) => {
      const label = formatSelectionLabel(b.kind, b.horse_1, b.horse_2, b.horse_3, nums);
      return `<div class="t-row"><span class="who">${escapeHtml(b.display_name)}</span>
        <span class="lab">${escapeHtml(BET_KIND_LABEL[b.kind])} ${escapeHtml(label)}</span>
        <span class="num">${b.amount}</span></div>`;
    })
    .join("");
  return `<div class="bet-mini">${rows || `<p class="note">まだありません</p>`}</div>`;
}

