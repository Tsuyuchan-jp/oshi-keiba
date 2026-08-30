import { escapeHtml } from "./http";
import { horseSheetParts } from "./horseName";
import { parseHorseScoreInput, STYLE_OPTIONS, type HorseScoreInput } from "./horseScoreInput";
import { findUmaDress, umaDressCatalogJsonForPage } from "./umaDress";
import { scoreFromHorse } from "./scoreFromHorse";
import { eventScoreSetup, numberByHorseId } from "./store";
import type { Board, EventRow, HorseBoard, UserRow, BetRow } from "./store";
import type { UndoMeta } from "./undo";
import { effectiveIdsFromScoreSetup } from "./scoreSetup";
import greenJson from "../data/green-skills.json" with { type: "json" };
import {
  adminOpsGuide,
  flashHtml,
  formatMove,
  formatOdds,
  formatOddsWithUnit,
  formatPt,
  formulaPanel,
  headerPhaseKind,
  statusLabel,
  toJstInput,
} from "./ui";
import { horsesAdminBody, ocrAdminScript, registerMaterialsHtml } from "./ocrAdmin";
import {
  heroUtilBarHtml,
  strategicSkillsAdminScript,
  strategicSkillsModalHtml,
} from "./strategicSkillsAdmin";
import type {
  StrategicSkillDismissedRow,
  StrategicSkillRow,
} from "./strategicSkills";
import type { ScoreRecomputeChange } from "./scoreRecompute";
import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  kindIsEnabled,
  OPTIONAL_BET_KINDS,
  parseEnabledKinds,
  settleBet,
  type BetKind,
} from "./bets";
import { parimutuelOdds } from "./odds";
import {
  DEFAULT_SCORE_REQ,
  DEFAULT_SCORE_SKILL_N,
  scoreSkillWeightN,
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
  const extra = status === "voting" ? " live" : "";
  return `<span class="phase ${headerPhaseKind(status)}${extra}">${escapeHtml(statusLabel(status))}</span>`;
}

/** 進行以外の管理タブで共有する、画面名・状態・操作のヘッダー。 */
function adminPageHero(
  title: string,
  status: EventRow["status"],
  opts: { meta?: string; actions?: string; notice?: string } = {},
): string {
  return `<section class="hero page-hero">
    <div class="page-hero-top">
      <div class="page-hero-title"><h1>${escapeHtml(title)}</h1>${phasePill(status)}${opts.meta ?? ""}</div>
      ${opts.actions ? `<div class="page-hero-actions">${opts.actions}</div>` : ""}
    </div>
    ${opts.notice ?? ""}
  </section>`;
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
  ["reset","undo","clear-horses","discard-event","revert-voting","scratch","drop-horse"].forEach((id) => {
    bindDlg(document.getElementById(id + "-modal"), document.getElementById(id + "-open"), document.getElementById(id + "-cancel"));
  });
  const rescoreDlg = document.getElementById("rescore-preview-modal");
  if (rescoreDlg) {
    const dismissRescore = () => window.location.assign("/admin/horses");
    rescoreDlg.showModal();
    document.getElementById("rescore-preview-title")?.focus();
    rescoreDlg.addEventListener("cancel", (ev) => {
      ev.preventDefault();
      dismissRescore();
    });
    rescoreDlg.addEventListener("click", (ev) => {
      const r = rescoreDlg.getBoundingClientRect();
      const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) dismissRescore();
    });
  }
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
  <div class="esc-top">  <p class="esc-k" style="margin:0">逃げ・復旧</p>
    <button type="button" id="esc-drawer-close" aria-label="閉じる">×</button></div>
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
  readonly: boolean,
): string {
  return `<script>
(() => {
  const LIVE = ${JSON.stringify(live)};
  const N = LIVE.length;
  const READONLY = ${readonly ? "true" : "false"};
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
    const drag = READONLY ? "" : ' draggable="true"';
    const st = READONLY ? " static" : "";
    return '<div class="horse' + on + st + '"' + drag + ' data-id="' + h.id + '"><span class="n">' + h.n + '</span><span class="uma">' + h.uma + '</span><span class="run">' + h.run + '</span></div>';
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
        (id ? horseEl(id) : (READONLY ? "" : '<span class="note">ここに置く</span>')) + "</div></div>"
      ).join("");
    }
    syncHidden();
    if (!READONLY) bind();
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
         <div class="work-actions">
           <button form="places-form" type="submit">着順を保存</button>
           <form method="post" action="/admin/publish" onsubmit="return confirm(${escapeHtml(JSON.stringify("結果を公開して払戻します。着順が一般に出ます。よろしいですか？"))});">
             <button type="submit" class="primary">結果を公開して払戻する</button>
           </form>
         </div>`
      : hidden;
  return `<section class="work" id="place-board"><h2>${e.status === "published" ? "確定着順" : "着順"}</h2>
    <div class="split"${e.status === "published" ? ` style="grid-template-columns:1fr"` : ""}>
      ${e.status === "published" ? "" : `<div><p class="col-h">未着順</p><div class="stack" id="place-idle"></div></div>`}
      <div><p class="col-h">${e.status === "published" ? "確定着順" : "着順"}</p>
        <div class="ranks-cols" id="place-ranks"></div></div>
    </div>
    ${save}
    ${placesScript(payload, e.status === "published")}
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

const STYLE_BTN: { key: string; label: string }[] = [
  { key: "runner", label: "逃げ" },
  { key: "leader", label: "先行" },
  { key: "betweener", label: "差し" },
  { key: "chaser", label: "追込" },
];

function styleSeg(selected: string | null | undefined): string {
  const cur = selected || "";
  const btns = STYLE_BTN.map(
    (o) =>
      `<button type="button"${o.key === cur ? ` class="on"` : ""} data-s="${o.key}">${o.label}</button>`,
  ).join("");
  const opts = [
    `<option value="">未選択</option>`,
    ...STYLE_OPTIONS.map((o) => {
      const sel = o.key === cur ? " selected" : "";
      return `<option value="${o.key}"${sel}>${escapeHtml(o.label)}</option>`;
    }),
  ].join("");
  return `<p class="set-k" style="margin-top:.85rem">出走脚質</p>
      <div class="set-seg" id="styles">${btns}</div>
      <select name="style_key" id="style-key" class="admin-offscreen" tabindex="-1">${opts}</select>`;
}

export type StrategicSkillsBundle = {
  skills: StrategicSkillRow[];
  dismissed: StrategicSkillDismissedRow[];
};

export function adminRegisterPage(
  board: Board,
  editId: string | null,
  flash?: { text: string | null; error: boolean },
  strategic: StrategicSkillsBundle = { skills: [], dismissed: [] },
): { body: string; scripts: string } {
  const setup = eventScoreSetup(board.event);
  const canSetup = board.event.status === "setup";
  const edit = editId ? board.horses.find((h) => h.horse.id === editId) : null;
  const list = board.horses
    .map((h) => {
      const p = horseSheetParts(h.horse);
      const on = edit?.horse.id === h.horse.id ? " on" : "";
      const man = h.horse.seed_source === "manual";
      const dropBtn =
        canSetup && !h.horse.scratched
          ? `<button type="button" class="reg-unlist" data-drop-id="${escapeHtml(h.horse.id)}" data-drop-name="${escapeHtml(p.umaName)}（${escapeHtml(p.runnerName)}）">外す</button>`
          : "";
      return `<div class="reg-row${on}">
        <a class="reg-row-link" href="/admin/register?edit=${escapeHtml(h.horse.id)}">
          <span class="n">${h.number}</span>
          <span class="who"><span class="uma">${escapeHtml(p.umaName)}</span><span class="run">${escapeHtml(p.runnerName)}</span></span>
          <span class="tag${man ? " warn" : ""}">${man ? "直置き" : "自動"}</span>
        </a>
        ${dropBtn}
      </div>`;
    })
    .join("");
  const flashEl = flash?.text
    ? `<p class="settings-flash${flash.error ? " err" : ""}">${escapeHtml(flash.text)}</p>`
    : "";
  const dismissedIds = new Set(strategic.dismissed.map((d) => d.skillId));
  const utilBar = heroUtilBarHtml(strategic.skills.length, canSetup);
  let benchTitle = "次の1頭";
  let benchMeta = "選ぶ → 読む → 登録";
  let benchInner = horsesAdminBody(board, canSetup, setup, { embedded: true });
  if (!canSetup) {
    benchTitle = "登録済み";
    benchMeta = "飛び入り禁止";
  }
  let nextAdd = "";
  let editModal = "";
  if (canSetup && edit && !edit.horse.scratched) {
    const p = horseSheetParts(edit.horse);
    const scoreIn = parseHorseScoreInput(edit.horse.score_input);
    const shot = edit.horse.shot_key
      ? `<button type="button" class="reg-shot-btn" id="shot-open" aria-label="スクショを大きく見る">
          <img class="reg-shot" src="/admin/shot/${escapeHtml(edit.horse.id)}" alt=""></button>`
      : `<div class="reg-shot empty">スクショなし</div>`;
    const auto = scoreFromHorse(setup, scoreIn, strategic.skills);
    const manualBox =
      edit.horse.seed_source === "manual" &&
      !(auto && auto.strength === edit.horse.strength);
    const dress = findUmaDress(edit.horse.chara_id, edit.horse.dress_id);
    const stat = (key: keyof HorseScoreInput["stats"], label: string) => `<label>${label}<input name="stat_${key}" type="number" min="0" value="${scoreIn?.stats[key] ?? 0}" required></label>`;
    const rank = (key: keyof HorseScoreInput["aptitudes"], label: string) => `<label>${label}<select name="apt_${key}">${["S", "A", "B", "C", "D", "E", "F", "G"].map((v) => `<option value="${v}"${scoreIn?.aptitudes[key] === v ? " selected" : ""}>${v}</option>`).join("")}</select></label>`;
    const editExtra = scoreIn ? `<input type="hidden" name="score_edit" value="1"><details class="edit-extra" open><summary>能力・適性・スキルを編集</summary><div class="edit-stat-grid">${stat("speed", "スピード")}${stat("stamina", "スタミナ")}${stat("power", "パワー")}${stat("guts", "根性")}${stat("wisdom", "賢さ")}</div><div class="edit-apt-grid">${rank("turf", "芝")}${rank("dirt", "ダート")}${rank("short", "短距離")}${rank("mile", "マイル")}${rank("medium", "中距離")}${rank("long", "長距離")}${rank("nige", "逃げ")}${rank("senkou", "先行")}${rank("sashi", "差し")}${rank("oikomi", "追込")}</div><label>スキル（1行につき1スキル）<textarea name="skill_names" rows="8">${escapeHtml(scoreIn.skillNames.join("\n"))}</textarea></label></details>` : "";
    benchTitle = "詳細確認";
    benchMeta = escapeHtml(p.umaName);
    nextAdd = `<a class="reg-next" href="/admin/register">＋ 次の1頭を登録</a>`;
    benchInner = `<form method="post" action="/admin/horse-edit" enctype="multipart/form-data" id="horse-edit">
        <input type="hidden" name="horse_id" value="${escapeHtml(edit.horse.id)}">
        <div class="table-scroll" id="bench">
          <div class="reg-bench">
            ${shot}
            <div>
              <div class="reg-names">
                <label>ウマ娘名<input name="uma_name" id="uma-name" value="${escapeHtml(p.umaName)}" required maxlength="40"></label>
                <label>出走者<input name="runner_name" id="runner-name" value="${escapeHtml(p.runnerName)}" required maxlength="40"></label>
                <div class="dress-picker" id="dress-picker">
                  <label>衣装（検索して選択）<input id="dress-search" type="search" value="${escapeHtml(dress?.dressName ?? "")}" placeholder="衣装名で検索" autocomplete="off"></label>
                  <input name="dress_id" id="dress-id" type="hidden" value="${dress?.dressId ?? ""}">
                  <button type="button" class="admin-action dress-clear" id="dress-clear">未指定にする</button>
                  <div class="dress-options" id="dress-options" role="listbox"></div>
                  <p class="note" id="dress-help">ウマ娘名に対応する衣装だけを表示します</p>
                </div>
                <div class="edit-shot-picker"><span>スクリーンショット（選択時のみ差し替え）</span><input class="admin-offscreen" name="shot" id="edit-shot-file" type="file" accept="image/png,image/jpeg,image/webp"><label class="admin-action" for="edit-shot-file">画像を選択</label><span id="edit-shot-name" class="note">変更しない</span></div>
                <label>意気込みコメント（40文字まで）<input name="paddock_comment" value="${escapeHtml(edit.horse.paddock_comment ?? "")}" maxlength="40"></label>
                <div class="edit-shot-picker"><span>トレーナーアイコン（選択時のみ差し替え）</span><input class="admin-offscreen" name="trainer_icon" id="trainer-icon-file" type="file" accept="image/png,image/jpeg,image/webp"><label class="admin-action" for="trainer-icon-file">画像を選択</label><span id="trainer-icon-name" class="note">${edit.horse.trainer_icon_key ? "登録済み" : "未登録"}</span></div>
              </div>
              ${styleSeg(scoreIn?.styleKey)}
              ${
                scoreIn
                  ? registerMaterialsHtml(
                      scoreIn,
                      scoreIn.styleKey && setup
                        ? effectiveIdsFromScoreSetup(setup, scoreIn.styleKey)
                        : null,
                      strategic.skills,
                      dismissedIds,
                      false, // 編集画面では例外に追加リンクを出さない
                    )
                  : ""
              }
              ${editExtra}
              <div class="reg-preview">
                <span class="lab">評価点</span>
                <span class="num">${escapeHtml(String(edit.horse.strength))}</span>
              </div>
              <div class="reg-score-row">
                <div class="reg-score-in">
                  <label>評価点<input name="strength" id="strength" type="number" min="0" step="0.1" value="${edit.horse.strength}" required></label>
                </div>
                <label class="reg-manual-toggle" for="strength-manual">
                  <input class="admin-offscreen" type="checkbox" name="strength_manual" id="strength-manual" value="1"${manualBox ? " checked" : ""}>
                  <span class="reg-manual-pill">評価点を直置き</span>
                </label>
              </div>
              <div class="ctas">
                <button type="submit" class="primary">更新</button>
                <button type="button" class="admin-action" id="horse-edit-cancel">キャンセル</button>
              </div>
            </div>
          </div>
        </div>
      </form>`;
    editModal = `<dialog class="modal horse-edit-modal" id="horse-edit-modal"><button type="button" class="modal-close" id="horse-edit-close" aria-label="閉じる">×</button><h2>出走内容を編集</h2>${benchInner}</dialog>`;
    benchInner = `<div class="table-scroll reg-detail-scroll" id="bench"><div class="reg-bench reg-detail">
        ${edit.horse.shot_key ? `<button type="button" class="reg-shot-btn" id="shot-open" aria-label="スクリーンショットを大きく見る"><img class="reg-shot" src="/admin/shot/${escapeHtml(edit.horse.id)}" alt=""></button>` : `<div class="reg-shot empty">スクショなし</div>`}
        <div><div class="reg-detail-names"><strong>${escapeHtml(p.umaName)}</strong><span class="detail-runner">${escapeHtml(p.runnerName)}</span><span class="detail-style">${escapeHtml(styleLabel(scoreIn?.styleKey))}</span></div>
          <div class="paddock-profile">${edit.horse.trainer_icon_key ? `<img src="/admin/trainer-icon/${escapeHtml(edit.horse.id)}" alt="${escapeHtml(p.runnerName)}のアイコン">` : `<span class="paddock-profile-placeholder">アイコン未登録</span>`}<div><span class="paddock-profile-k">意気込み</span><p>${escapeHtml(edit.horse.paddock_comment || "未登録")}</p></div></div>
          ${scoreIn ? registerMaterialsHtml(scoreIn, scoreIn.styleKey && setup ? effectiveIdsFromScoreSetup(setup, scoreIn.styleKey) : null, strategic.skills, dismissedIds, false) : ""}
          <div class="reg-preview"><span class="lab">評価点</span><span class="num">${escapeHtml(String(edit.horse.strength))}</span></div>
        </div></div></div>`;
    nextAdd = `<button type="button" class="reg-next" id="horse-edit-open">編集</button>`;
  }
  const body = `${adminPageHero("出走登録", board.event.status, {
      meta: `<span class="page-hero-meta" id="count">${board.horses.length} / 18</span>`,
      actions: utilBar,
      notice: flashEl,
    })}
    <div class="register-desk">
      <section class="work">
        <div class="work-head"><h2>名簿</h2><span class="odds-meta">登録済み</span></div>
        <div class="table-scroll"><div class="reg-list" id="list">${list || `<p class="reg-locked">まだいません</p>`}</div></div>
      </section>
      <section class="work">
        <div class="work-head">
          <div class="work-head-main">
            <h2 id="bench-title">${escapeHtml(benchTitle)}</h2>
            <span class="odds-meta" id="bench-meta">${benchMeta}</span>
          </div>
          ${nextAdd}
        </div>
        ${benchInner}
      </section>
    </div>
    ${editModal}
    <dialog class="shot-dlg shot-dlg-left" id="shot-dlg"><div class="shot-scroller fit" id="shot-scroller"><img id="shot-full" alt=""></div></dialog>
    ${strategicSkillsModalHtml()}
    <dialog class="modal" id="drop-horse-modal">
      <h2>名簿から外す</h2>
      <p id="drop-horse-p"></p>
      <p class="note">出走タブの「取消」（馬券の全額返還）ではありません。投票開始前の、この頭の登録を消します。</p>
      <form method="post" action="/admin/horse-drop" id="drop-horse-form" autocomplete="off"
        data-confirm="この頭を名簿から消します。出走取消（返還）ではありません。よろしいですか？">
        <input type="hidden" name="horse_id" id="drop-horse-id">
        <div class="row"><button class="danger" type="submit">名簿から外す</button>
          <button type="button" class="secondary" id="drop-horse-cancel">やめる</button></div>
      </form>
    </dialog>
    ${bindDlgScript()}
    <script>
      const dlg = document.getElementById("shot-dlg");
      const editDlg = document.getElementById("horse-edit-modal");
      document.getElementById("horse-edit-open")?.addEventListener("click", () => editDlg?.showModal());
      const closeEdit = () => {
        if (window.confirm("編集内容を破棄して閉じます")) editDlg?.close();
      };
      document.getElementById("horse-edit-cancel")?.addEventListener("click", closeEdit);
      document.getElementById("horse-edit-close")?.addEventListener("click", closeEdit);
      document.getElementById("edit-shot-file")?.addEventListener("change", (ev) => {
        const file = ev.target instanceof HTMLInputElement ? ev.target.files?.[0] : null;
        const name = document.getElementById("edit-shot-name");
        if (name) name.textContent = file ? file.name : "変更しない";
      });
      document.getElementById("trainer-icon-file")?.addEventListener("change", (ev) => {
        const file = ev.target instanceof HTMLInputElement ? ev.target.files?.[0] : null;
        const name = document.getElementById("trainer-icon-name");
        if (name) name.textContent = file ? file.name : "未登録";
      });
      (() => {
        const catalog = ${umaDressCatalogJsonForPage()};
        const uma = document.getElementById("uma-name");
        const search = document.getElementById("dress-search");
        const hidden = document.getElementById("dress-id");
        const options = document.getElementById("dress-options");
        const help = document.getElementById("dress-help");
        const norm = (value) => String(value || "").normalize("NFKC").replace(/[\\s\\u3000\\[\\]]/g, "").toLowerCase();
        const clear = () => { if (hidden) hidden.value = ""; if (search) search.value = ""; };
        const render = () => {
          if (!options || !uma || !search) return;
          const chara = norm(uma.value);
          const query = norm(search.value);
          const rows = catalog.filter((row) => norm(row.charaName) === chara && (!query || norm(row.dressName).includes(query)));
          options.innerHTML = "";
          if (!chara) { if (help) help.textContent = "先にウマ娘名を入力してください"; return; }
          if (!rows.length) { if (help) help.textContent = "一致する衣装がありません"; return; }
          if (help) help.textContent = String(rows.length) + " 件の衣装から選べます";
          rows.forEach((row) => {
            const button = document.createElement("button");
            button.type = "button"; button.className = "dress-option"; button.setAttribute("role", "option");
            if (String(hidden?.value || "") === String(row.dressId)) button.classList.add("on");
            const image = "/images/umamusume/petit/petit_" + row.charaId + "_" + row.dressId + "_0010.png";
            button.innerHTML = '<img src="' + image + '" alt=""><span>' + row.dressName + '</span>';
            button.addEventListener("click", () => { if (hidden) hidden.value = String(row.dressId); search.value = row.dressName; render(); });
            options.append(button);
          });
        };
        search?.addEventListener("input", () => { if (hidden) hidden.value = ""; render(); });
        uma?.addEventListener("input", () => { clear(); render(); });
        document.getElementById("dress-clear")?.addEventListener("click", () => { clear(); render(); });
        render();
      })();
      const full = document.getElementById("shot-full");
      const sc = document.getElementById("shot-scroller");
      document.getElementById("shot-open")?.addEventListener("click", () => {
        const img = document.querySelector("#shot-open img");
        if (full && img) full.src = img.getAttribute("src") || "";
        sc?.classList.add("fit");
        sc?.classList.remove("read");
        dlg?.showModal();
      });
      const toggleShotZoom = () => {
        sc?.classList.toggle("fit");
        sc?.classList.toggle("read");
      };
      const onShotClick = (ev) => {
        if (ev.target instanceof HTMLImageElement) {
          toggleShotZoom();
          return;
        }
        dlg?.close();
      };
      // sc と dlg の二重登録だとトグルが打ち消し合うため dlg のみ
      dlg?.addEventListener("click", onShotClick);
      dlg?.addEventListener("dblclick", (ev) => {
        if (ev.target instanceof HTMLImageElement) toggleShotZoom();
      });
      const ddlg = document.getElementById("drop-horse-modal");
      document.querySelectorAll("[data-drop-id]").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          document.getElementById("drop-horse-id").value = btn.getAttribute("data-drop-id");
          document.getElementById("drop-horse-p").textContent =
            "「" + btn.getAttribute("data-drop-name") + "」を名簿から消します。";
          ddlg?.showModal();
        });
      });
      const styles = document.getElementById("styles");
      const styleEl = document.getElementById("style-key");
      styles?.querySelectorAll("[data-s]").forEach((b) => {
        b.addEventListener("click", () => {
          if (styleEl) styleEl.value = b.dataset.s || "";
          styles.querySelectorAll("[data-s]").forEach((x) => {
            x.classList.toggle("on", x.dataset.s === (styleEl && styleEl.value));
          });
          styleEl?.dispatchEvent(new Event("change"));
        });
      });
      document.getElementById("horse-edit")?.addEventListener("submit", (ev) => {
        if (styleEl && !String(styleEl.value || "").trim()) {
          ev.preventDefault();
          document.getElementById("styles")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          alert("脚質を選んでください");
        }
      });
    </script>`;
  const greenNames = (greenJson as { skills: { name: string }[] }).skills.map(
    (s) => s.name,
  );
  const dismissedIdList = [...dismissedIds];
  const ocrScript = canSetup
    ? ocrAdminScript(
        !!setup,
        setup?.effectiveSkillIds ?? null,
        greenNames,
        strategic.skills,
        dismissedIdList,
        canSetup,
      )
    : "";
  const strategicScript = strategicSkillsAdminScript(canSetup, strategic);
  return {
    body,
    scripts: ocrScript + strategicScript,
  };
}

function styleLabel(key: string | null | undefined): string {
  return STYLE_OPTIONS.find((x) => x.key === key)?.label ?? "—";
}

/** 倍率・r は小数第3位まで */
function fmt3(n: number): string {
  return n.toFixed(3);
}

function median(values: readonly number[]): number {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function isAptS(rank: string | undefined): boolean {
  return String(rank ?? "").trim().toUpperCase() === "S";
}

/** r の定義式（ラベル付き・左から右） */
function rDefLabeled(
  base: number,
  green: number,
  aptMul: number,
  req: number,
  baseLab: string,
): string {
  let core: string;
  if (!green) core = `${baseLab}${base}`;
  else if (green > 0) core = `${baseLab}${base}+緑${green}`;
  else core = `${baseLab}${base}−緑${Math.abs(green)}`;
  const left =
    aptMul !== 1
      ? `(${core})×適正${aptMul}`
      : green
        ? `(${core})`
        : core;
  return `${left}/目標値${req}`;
}

/** 頭は S 倍率。後ろに薄い字で出し方（定義 → r → S式） */
function sMultLine(mult: number, sHow: string): string {
  return `×${fmt3(mult)} <span class="pipe-s-calc">${escapeHtml(sHow)}</span>`;
}

function ratioSHow(
  r: number,
  n: number,
  m: number,
  rDef: string,
  mult: number,
): string {
  const rr = fmt3(r);
  const head = `（${rDef}） r=${rr}`;
  if (!(r > 0) || !Number.isFinite(r)) return `${head}　r≤0のため 0`;
  if (r >= 1) {
    if (n === 1) return `${head}　S=r=${fmt3(mult)}`;
    return `${head}　1+(${rr}−1)/${n}=${fmt3(mult)}`;
  }
  return `${head}　1+(${rr}−1)×${m}=${fmt3(mult)}`;
}

function speedSHow(r: number, rDef: string, mult: number): string {
  const rr = fmt3(r);
  const head = `（${rDef}） r=${rr}`;
  if (!(r >= 1) || !Number.isFinite(r)) return `${head}　未達は見ない`;
  return `${head}　1+(${rr}−1)/4=${fmt3(mult)}`;
}

function staminaExplain(
  stamina: number,
  req: { staminaNoTempt: number; staminaWithTempt: number; staminaRace: boolean },
): string {
  const no = stamina >= req.staminaNoTempt;
  const withT = stamina >= req.staminaWithTempt;
  if (no && withT) return "掛かりなし・あり達成";
  if (req.staminaRace) {
    if (!no) return "勝負コース・掛かりなし未達";
    return "勝負コース・掛かりありだけ未達";
  }
  if (!no) return "掛かりなし未達";
  return "掛かりありだけ未達";
}

function pipeHtml(
  h: HorseBoard,
  board: Board,
  strategicSkills: readonly StrategicSkillRow[] = [],
  preview?: readonly ScoreRecomputeChange[],
): string {
  const p = horseSheetParts(h.horse);
  const input = parseHorseScoreInput(h.horse.score_input);
  const setup = eventScoreSetup(board.event);
  const auto = scoreFromHorse(setup, input, strategicSkills);
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
  const cs = b.characterSpec;
  const req = setup!.requirements;
  const st = input!.stats;
  const gr = b.green;
  const apt = auto.aptitudes;
  const greenLines = b.appliedGreens.length
    ? b.appliedGreens
        .map((g) => {
          const parts = [
            g.speed && `速${g.speed > 0 ? "+" : ""}${g.speed}`,
            g.stamina && `スタ${g.stamina > 0 ? "+" : ""}${g.stamina}`,
            g.power && `パ${g.power > 0 ? "+" : ""}${g.power}`,
            g.guts && `根${g.guts > 0 ? "+" : ""}${g.guts}`,
            g.wisdom && `賢${g.wisdom > 0 ? "+" : ""}${g.wisdom}`,
          ].filter(Boolean);
          return `${escapeHtml(g.name)} → ${escapeHtml(parts.join(" ") || "—")}`;
        })
        .join("<br>")
    : "なし";
  const distMul = isAptS(apt.distance) ? 1.1 : 1;
  const surfMul = isAptS(apt.surface) ? 1.05 : 1;
  const styleMul = isAptS(apt.style) ? 1.1 : 1;
  const speedLine = sMultLine(
    b.ratios.speed,
    speedSHow(
      b.rawRatios.speed,
      rDefLabeled(st.speed, gr.speed, distMul, req.speedCap, "スピ"),
      b.ratios.speed,
    ),
  );
  const powerLine = sMultLine(
    b.ratios.power,
    ratioSHow(
      b.rawRatios.power,
      4,
      4,
      rDefLabeled(st.power, gr.power, surfMul, req.power, "パワ"),
      b.ratios.power,
    ),
  );
  const gutsLine = sMultLine(
    b.ratios.guts,
    ratioSHow(
      b.rawRatios.guts,
      10,
      2,
      rDefLabeled(st.guts, gr.guts, 1, req.guts, "根"),
      b.ratios.guts,
    ),
  );
  const wisLine = sMultLine(
    b.ratios.wisdom,
    ratioSHow(
      b.rawRatios.wisdom,
      1,
      6,
      rDefLabeled(st.wisdom, gr.wisdom, styleMul, req.wisdom, "賢"),
      b.ratios.wisdom,
    ),
  );
  const staLine = sMultLine(b.ratios.staminaMult, staminaExplain(b.adjusted.stamina, req));
  const stratPart =
    s.strategicPoints > 0 ? ` ＋ 戦略例外 ${s.strategicPoints}` : "";
  const specLine = cs.totalBab > 0 && cs.medianBab > 0
    ? `×${fmt3(cs.multiplier)} <span class="pipe-s-calc">(E ${fmt3(cs.totalBab)}バ / R ${fmt3(cs.medianBab)}バ)^0.20 = ${fmt3(cs.multiplier)}</span>`
    : "×1.000 <span class=\"pipe-s-calc\">該当スキルなし</span>";
  const skillWeightN = scoreSkillWeightN(setup);
  const skillFormula = `90 × (${s.base} / 90)^${skillWeightN} × ${fmt3(cs.multiplier)} = ${fmt3(b.weightedSkillBase)}`;
  const formula = `スキル点${fmt3(b.weightedSkillBase)} × スピ${fmt3(b.ratios.speed)} × スタ${fmt3(b.ratios.staminaMult)} × パワ${fmt3(b.ratios.power)} × 根性${fmt3(b.ratios.guts)} × 賢さ${fmt3(b.ratios.wisdom)} ＝ ${h.horse.strength}`;
  return `${head}
    <div class="pipe-step"><div class="pipe-k">土台（スキル）</div>
      <div>有効 ${s.effectiveCount} ＋ 金×2（${s.goldCount}枚）${stratPart} ＋ ためらい ${s.tameraiCount}＝ <b>${s.base}</b></div></div>
    <div class="pipe-step"><div class="pipe-k">キャラスペック <span class="pipe-s-calc">E=固有・進化スキルの有効バ身　R=このコースの中央値</span></div><div class="pipe-v">${specLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">スキル点算出式</div><div class="pipe-v">${escapeHtml(skillFormula)}</div></div>
    <div class="pipe-step"><div class="pipe-k">緑 → ステへ</div><div class="pipe-green">${greenLines}</div></div>
    <div class="pipe-step"><div class="pipe-k">スピード</div><div class="pipe-v">${speedLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">スタミナ</div><div class="pipe-v">${staLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">パワー</div><div class="pipe-v">${powerLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">根性</div><div class="pipe-v">${gutsLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">賢さ</div><div class="pipe-v">${wisLine}</div></div>
    <div class="pipe-step"><div class="pipe-k">評価点算出式</div>
      <p class="pipe-eq">${escapeHtml(formula)}</p>
      <div class="pipe-final">${h.horse.strength}</div>
      <p class="pipe-eq">Seed ${Math.round(h.seed).toLocaleString("ja-JP")}</p></div>`;
}

export function adminHorsesPage(
  board: Board,
  selId: string | null,
  reauth: string,
  strategicSkills: readonly StrategicSkillRow[] = [],
  preview?: readonly ScoreRecomputeChange[],
): string {
  const canRescore = board.event.status === "setup";
  const rescore = canRescore
    ? `<a class="admin-action admin-action--secondary" href="/admin/horses?rescore=preview">自動評価点を確認・再計算</a>`
    : `<button class="admin-action admin-action--secondary" type="button" disabled>自動評価点を確認・再計算</button>`;
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
      const openOdds = h.horse.scratched
        ? null
        : parimutuelOdds(h.seed, board.seedTotal, board.event.takeout_d);
      return `<tr data-id="${escapeHtml(h.horse.id)}" class="${on}${h.horse.scratched ? " scr" : ""}">
        <td>${h.number}</td><td>${escapeHtml(p.umaName)}</td><td>${escapeHtml(p.runnerName)}</td>
        <td>${escapeHtml(styleLabel(input?.styleKey))}</td>
        <td class="num">${formatOdds(openOdds)}</td>
        <td class="num">${h.horse.strength}</td>
        <td>${man ? `<span class="tag warn">直置き</span>` : `<span class="tag">自動</span>`}</td>
        <td class="num">${Math.round(h.seed).toLocaleString("ja-JP")}</td>
        <td>${scratch}</td></tr>`;
    })
    .join("");
  const current = board.horses.find((h) => h.horse.id === sel) ?? board.horses[0];
  const pipe = current
    ? pipeHtml(current, board, strategicSkills)
    : `<p class="note">まだいません</p>`;
  const previewHtml = preview
    ? `<dialog class="modal" id="rescore-preview-modal"><h2 class="modal-title" id="rescore-preview-title" tabindex="-1">再計算内容の確認</h2><p class="note">${preview.length ? `${preview.length}頭の自動評価点を更新します。` : "変更対象はありません。"}</p>${preview.length ? `<table class="plain"><thead><tr><th>出走馬</th><th>現在</th><th>再計算後</th><th>キャラスペック</th></tr></thead><tbody>${preview.map((x) => `<tr><td>${escapeHtml(x.name)}</td><td class="num">${x.before}</td><td class="num">${x.after}</td><td class="num">×${fmt3(x.characterSpecMultiplier)}</td></tr>`).join("")}</tbody></table>` : ""}<div class="modal-actions"><form method="post" action="/admin/rescore"><button class="admin-action admin-action--primary" type="submit"${preview.length ? "" : " disabled"}>この内容で再計算</button></form><form method="get" action="/admin/horses"><button class="admin-action admin-action--secondary" type="submit">キャンセル</button></form></div></dialog>`
    : "";
  return `${adminPageHero("出走", board.event.status, { actions: rescore })}${previewHtml}
    <div class="horses-desk">
      <section class="work"><h2>名簿</h2>
        <table class="plain" id="roster"><thead><tr>
          <th>#</th><th>ウマ娘</th><th>出走者</th><th>脚質</th><th class="num">初期オッズ</th><th class="num">評価点</th><th></th><th class="num">Seed</th><th></th>
        </tr></thead><tbody>${rows || `<tr><td colspan="9">まだいません</td></tr>`}</tbody></table>
      </section>
      <aside class="pipe">${pipe}</aside>
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
      const sc = document.getElementById("shot-scroller");
      document.querySelectorAll("[data-shot]").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (full) full.src = btn.getAttribute("data-shot") || "";
          sc?.classList.add("fit");
          sc?.classList.remove("read");
          dlg?.showModal();
        });
      });
      const toggleShotZoom = () => {
        sc?.classList.toggle("fit");
        sc?.classList.toggle("read");
      };
      const onShotClick = (ev) => {
        if (ev.target instanceof HTMLImageElement) {
          toggleShotZoom();
          return;
        }
        dlg?.close();
      };
      // sc と dlg の二重登録だとトグルが打ち消し合うため dlg のみ
      dlg?.addEventListener("click", onShotClick);
      dlg?.addEventListener("dblclick", (ev) => {
        if (ev.target instanceof HTMLImageElement) toggleShotZoom();
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
  return `${adminPageHero("台帳", opts.board.event.status)}
    <div class="ledger-desk">
      <section class="work">
        <div class="work-head"><h2>残高</h2>
          <button type="button" class="ledger-del" id="member-del-open">メンバー削除</button></div>
        <div class="table-scroll">
          <table class="plain"><thead><tr><th>名前</th><th class="num">残高</th></tr></thead>
            <tbody>${memberRows || `<tr><td colspan="2" class="muted">まだいません</td></tr>`}</tbody></table>
        </div>
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
          <label>額 <select id="f-amt"><option value="">すべて</option>
            <option value="500">500以上</option>
            <option value="3000">3000以上</option></select></label>
        </div>
        <p class="filter-count" id="f-count"></p>
        <div class="table-scroll">
          <table class="plain" id="bets-table"><thead><tr>
            <th>誰</th><th>賭式</th><th>組み合わせ</th>
            <th class="num">額</th><th>結果</th><th class="num">確定配当</th><th class="num">収支</th>
          </tr></thead>
            <tbody>${opts.betRows || `<tr><td colspan="7" class="muted">なし</td></tr>`}</tbody></table>
        </div>
      </section>
    </div>
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
    <script>
      const dlg = document.getElementById("member-del-modal");
      document.getElementById("member-del-open")?.addEventListener("click", () => dlg?.showModal());
      document.getElementById("member-del-cancel")?.addEventListener("click", () => dlg?.close());
      dlg?.addEventListener("click", (ev) => {
        const r = dlg.getBoundingClientRect();
        const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside) dlg.close();
      });
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
      const amt = document.getElementById("f-amt");
      const countEl = document.getElementById("f-count");
      const apply = () => {
        const rows = document.querySelectorAll("#bets-table tbody tr[data-kind]");
        let shown = 0;
        rows.forEach((tr) => {
          const min = amt.value ? Number(amt.value) : 0;
          const ok = (!kind.value || tr.dataset.kind === kind.value)
            && (!res.value || tr.dataset.res === res.value)
            && (!who.value || tr.dataset.who === who.value)
            && Number(tr.dataset.amt || 0) >= min;
          tr.hidden = !ok;
          if (ok) shown++;
        });
        if (countEl) countEl.textContent = "表示 " + shown + " / " + rows.length + " 件";
      };
      kind?.addEventListener("change", apply);
      res?.addEventListener("change", apply);
      who?.addEventListener("change", apply);
      amt?.addEventListener("change", apply);
      apply();
    </script>`;
}

export function adminOddsPage(board: Board): string {
  const ref =
    board.event.status === "voting" || board.event.status === "setup";
  const col = ref ? "参考" : "確定";
  const kinds: { kind: BetKind; area: string }[] = [
    { kind: "win", area: "win" },
    { kind: "umaren", area: "q" },
    { kind: "umatan", area: "e" },
    { kind: "sanrenpuku", area: "t" },
    { kind: "sanrentan", area: "f" },
  ];
  const nums = numberByHorseId(board);
  const panels = kinds
    .map((k) => oddsKindPanel(board, k.kind, k.area, col, ref, nums))
    .join("");
  return `${adminPageHero("オッズ", board.event.status, {
      actions: `<button type="button" class="admin-action admin-action--secondary" id="formula-open">内部計算</button>`,
    })}
    <div class="odds-desk">${panels}</div>
    <dialog class="modal" id="formula-modal">
      <h2>内部計算</h2>
      ${formulaPanel(board)}
      <div class="modal-actions"><form method="dialog"><button class="admin-action admin-action--secondary" type="submit">閉じる</button></form></div>
    </dialog>
    <script>
      const formulaDlg = document.getElementById("formula-modal");
      document.getElementById("formula-open")?.addEventListener("click", () => formulaDlg?.showModal());
      formulaDlg?.addEventListener("click", (ev) => {
        const r = formulaDlg.getBoundingClientRect();
        const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        if (!inside) formulaDlg.close();
      });
    </script>`;
}

function oddsKindPanel(
  board: Board,
  kind: BetKind,
  area: string,
  col: string,
  ref: boolean,
  nums: Map<string, number>,
): string {
  const label = BET_KIND_LABEL[kind];
  const on = kindIsEnabled(board.event.enabled_kinds, kind);
  const pool = board.pools.find((p) => p.kind === kind);
  const voided = !ref && !!pool?.voidSpecial;
  const banner = voided
    ? `<p class="odds-void">特払い · 当たりに実票ゼロ · 8割戻し</p>`
    : "";
  if (!on) {
    return `<section class="work odds-panel odds-panel-${area}">
      <div class="work-head"><h2>${label} · ${col}</h2><span class="odds-meta">使わない</span></div>
      <div class="table-scroll"></div></section>`;
  }
  let meta = "";
  let table = "";
  if (kind === "win") {
    const live = board.horses.filter((h) => !h.horse.scratched);
    meta = `${live.length}頭 · 全頭`;
    const rows = live
      .map((h) => {
        const p = horseSheetParts(h.horse);
        const odds = ref ? h.referenceOdds : h.confirmedOdds;
        const cell = voided ? "特払い" : formatOddsWithUnit(odds);
        return `<tr><td>${h.number}</td><td>${escapeHtml(p.umaName)}</td><td>${escapeHtml(p.runnerName)}</td><td class="num">${cell}</td></tr>`;
      })
      .join("");
    table = `<table class="plain"><thead><tr><th>#</th><th>ウマ娘</th><th>出走者</th><th class="num">${col}</th></tr></thead><tbody>${rows}</tbody></table>`;
  } else {
    const combos = pool?.combos ?? [];
    meta = `${combos.length}組 · 実票のみ`;
    if (combos.length === 0) {
      table = `<p class="note">—</p>`;
    } else {
      const rows = combos
        .map((c) => {
          const lab = formatSelectionLabel(kind, c.horse_1, c.horse_2, c.horse_3, nums);
          const cell = voided ? "特払い" : formatOddsWithUnit(c.odds);
          return `<tr><td>${escapeHtml(lab)}</td><td class="num">${cell}</td></tr>`;
        })
        .join("");
      table = `<table class="plain"><thead><tr><th>買い目</th><th class="num">${col}</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
  return `<section class="work odds-panel odds-panel-${area}">
      <div class="work-head"><h2>${label} · ${col}</h2><span class="odds-meta">${meta}</span></div>
      ${banner}
      <div class="table-scroll">${table}</div></section>`;
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
  const titleValue = e.title === "推し活イベントレース" ? "" : e.title;
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
  const staminaStyles = [
    ["runner", "逃げ"],
    ["leader", "先行"],
    ["betweener", "差し"],
    ["chaser", "追込"],
  ] as const;
  const staminaValue = (style: typeof staminaStyles[number][0], kind: "noTempt" | "withTempt") =>
    num(r?.staminaByStyle?.[style]?.[kind] ?? (kind === "noTempt" ? r?.staminaNoTempt : r?.staminaWithTempt));
  const staminaCount = staminaStyles.reduce((count, [style]) => count +
    (staminaValue(style, "noTempt") ? 1 : 0) + (staminaValue(style, "withTempt") ? 1 : 0), 0);
  const staminaStatus = staminaCount === 8 ? "設定済み" : staminaCount ? `${staminaCount} / 8` : "未設定";
  const staminaInputs = staminaStyles.map(([style, label]) => `<tr>
    <th scope="row">${label}</th>
    <td><input name="score_stamina_${style}_no" type="number" min="1" value="${escapeHtml(staminaValue(style, "noTempt"))}" aria-label="${label}・掛かりなし"></td>
    <td><input name="score_stamina_${style}_with" type="number" min="1" value="${escapeHtml(staminaValue(style, "withTempt"))}" aria-label="${label}・掛かりあり"></td>
  </tr>`).join("");
  const reqVal = (saved: number | undefined, fallback: number) =>
    escapeHtml(saved == null ? String(fallback) : String(saved));
  const ids = setup?.effectiveSkillIds;
  const specs = setup?.characterSpecs;
  const skillsMeta = ids
    ? `<span class="odds-meta">有効スキル取得済み　逃 ${ids.runner.length} · 先 ${ids.leader.length} · 差 ${ids.betweener.length} · 追 ${ids.chaser.length}</span>`
    : "";
  const specMeta = specs?.length
    ? `<span class="odds-meta">キャラスペック: 取得済み（${specs.length}キャラ・R ${fmt3(median(specs.map((s) => s.totalBab)))}バ）</span>`
    : `<span class="odds-meta">キャラスペック: 未取得（×1.00）</span>`;
  const stamOn = !!r?.staminaRace;
  const skillWeightN = setup?.skillWeightN ?? DEFAULT_SCORE_SKILL_N;
  const flashEl = flash?.text
    ? `<p class="settings-flash${flash.error ? " err" : ""}">${escapeHtml(flash.text)}</p>`
    : "";
  const body = `${adminPageHero("開催設定", e.status, {
      actions: `<button type="button" class="admin-action admin-action--primary" id="settings-save-open">保存</button>`,
    })}
    <form class="settings-desk" id="settings-form" method="post" action="/admin/params">
      <div class="settings-top">
        <section class="work">
          <p class="set-k">イベント概要</p>
          <input class="set-title" name="title" value="${escapeHtml(titleValue)}" placeholder="イベント名" aria-label="タイトル">
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
          ${skillsMeta}${specMeta}
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
            <div class="set-target set-stamina-card">
              <button type="button" class="set-stamina-open" id="stamina-settings-open"><span class="k">スタミナ</span><strong id="stamina-settings-status">${staminaStatus}</strong><span class="set-stamina-edit">編集 →</span><span class="set-stamina-race-state">スタミナ勝負：${stamOn ? "あり" : "なし"}</span></button>
              <input type="hidden" name="score_stamina_race" id="stamina-race" value="${stamOn ? "1" : ""}">
            </div>
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
          <label class="set-metric">
            <span class="sym">n</span>
            <span class="k">スキル重み</span>
            <input name="score_skill_weight_n" type="number" min="1" max="10" step="0.1" value="${skillWeightN}">
            <span class="d">S0の差を強調する累乗</span>
          </label>
        </div>
      </section>
      <dialog class="modal stamina-modal" id="stamina-settings-modal">
        <h2>脚質ごとのスタミナ目標</h2>
        <p class="note">掛かりありは、同じ脚質の掛かりなし以上の値を入力してください。</p>
        <div class="stamina-modal-toggle" aria-label="スタミナ勝負">
          <span>スタミナ勝負</span>
          <button type="button" data-stamina-race="0"${stamOn ? "" : ` class="on"`}>なし</button>
          <button type="button" data-stamina-race="1"${stamOn ? ` class="on"` : ""}>あり</button>
        </div>
        <table class="plain stamina-table"><thead><tr><th>脚質</th><th>掛かりなし</th><th>掛かりあり</th></tr></thead><tbody>${staminaInputs}</tbody></table>
        <div class="modal-actions"><button type="button" class="admin-action admin-action--primary" id="stamina-settings-done">入力を確認</button><button type="button" class="admin-action admin-action--secondary" id="stamina-settings-cancel">閉じる</button></div>
      </dialog>
      <dialog class="modal" id="settings-save-modal">
        <h2>開催設定を保存</h2>
        <p id="settings-save-summary">再計算内容を確認しています。</p>
        <div id="settings-save-changes"></div>
        <div class="modal-actions"><button type="button" class="admin-action admin-action--primary" id="settings-save-confirm" disabled>この内容で保存・再計算</button><button type="button" class="admin-action admin-action--secondary" id="settings-save-cancel">キャンセル</button></div>
      </dialog>
      <dialog class="modal" id="settings-alert-modal">
        <h2>入力内容を確認</h2>
        <p id="settings-alert-message"></p>
        <div class="modal-actions"><button type="button" class="admin-action admin-action--primary" id="settings-alert-close">確認</button></div>
      </dialog>
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
    const stamIn = document.getElementById("stamina-race");
    document.querySelectorAll("[data-stamina-race]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("data-stamina-race") === "1";
        if (stamIn) stamIn.value = on ? "1" : "";
        document.querySelectorAll("[data-stamina-race]").forEach((x) => x.classList.toggle("on", x === btn));
        const state = document.querySelector(".set-stamina-race-state");
        if (state) state.textContent = "スタミナ勝負：" + (on ? "あり" : "なし");
      });
    });
    const staminaDlg = document.getElementById("stamina-settings-modal");
    const staminaOpen = document.getElementById("stamina-settings-open");
    const staminaDone = document.getElementById("stamina-settings-done");
    const staminaCancel = document.getElementById("stamina-settings-cancel");
    const staminaStatus = document.getElementById("stamina-settings-status");
    const staminaFields = [...document.querySelectorAll('input[name^="score_stamina_"]')].filter((x) => x.type === "number");
    const updateStaminaStatus = () => {
      const count = staminaFields.filter((x) => x.value.trim()).length;
      if (staminaStatus) staminaStatus.textContent = count === 8 ? "設定済み" : count ? count + " / 8" : "未設定";
    };
    staminaOpen?.addEventListener("click", () => staminaDlg?.showModal());
    staminaCancel?.addEventListener("click", () => staminaDlg?.close());
    staminaDone?.addEventListener("click", () => { updateStaminaStatus(); staminaDlg?.close(); });
    staminaFields.forEach((field) => field.addEventListener("input", updateStaminaStatus));
    staminaDlg?.addEventListener("click", (ev) => { const box = staminaDlg.getBoundingClientRect(); if (ev.clientX < box.left || ev.clientX > box.right || ev.clientY < box.top || ev.clientY > box.bottom) staminaDlg.close(); });
    const settingsForm = document.getElementById("settings-form");
    const saveDlg = document.getElementById("settings-save-modal");
    const saveSummary = document.getElementById("settings-save-summary");
    const saveChanges = document.getElementById("settings-save-changes");
    const saveConfirm = document.getElementById("settings-save-confirm");
    const alertDlg = document.getElementById("settings-alert-modal");
    const alertMessage = document.getElementById("settings-alert-message");
    let focusAfterAlert = null;
    const requiredNames = ["title", "score_course", "score_weather", "score_ground_condition", "score_season", "score_speed_cap", "score_power", "score_guts", "score_wisdom", ...["runner", "leader", "betweener", "chaser"].flatMap((s) => ["score_stamina_" + s + "_no", "score_stamina_" + s + "_with"])];
    const validateSettings = () => {
      const missing = requiredNames.map((name) => ({ name, el: settingsForm?.elements.namedItem(name) })).find(({ el }) => !el || !(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.value.trim());
      if (missing) {
        saveDlg?.close();
        focusAfterAlert = missing.el;
        if (alertMessage) alertMessage.textContent = missing.name === "title" ? "イベント名を入力してください。" : "必要な項目をすべて入力してください。";
        alertDlg?.showModal();
        return false;
      }
      return true;
    };
    const showSavePreview = async () => {
      if (!settingsForm || !validateSettings()) return;
      if (saveSummary) saveSummary.textContent = "再計算内容を確認しています。";
      if (saveChanges) saveChanges.replaceChildren();
      if (saveConfirm instanceof HTMLButtonElement) saveConfirm.disabled = true;
      saveDlg?.showModal();
      try {
        const res = await fetch("/admin/params/preview", { method: "POST", body: new FormData(settingsForm) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "再計算内容を取得できません");
        const changes = Array.isArray(data.changes) ? data.changes : [];
        if (saveSummary) saveSummary.textContent = changes.length ? changes.length + "頭の自動評価点を更新します。" : "評価点の変更対象はありません。";
        if (saveChanges && changes.length) {
          const table = document.createElement("table");
          table.className = "plain";
          table.innerHTML = "<thead><tr><th>出走馬</th><th>現在</th><th>再計算後</th><th>キャラスペック</th></tr></thead>";
          const body = document.createElement("tbody");
          changes.forEach((change) => {
            const row = document.createElement("tr");
            [change.name, change.before, change.after, "×" + Number(change.characterSpecMultiplier).toFixed(3)].forEach((value) => {
              const cell = document.createElement("td");
              cell.textContent = String(value);
              row.append(cell);
            });
            body.append(row);
          });
          table.append(body);
          saveChanges.append(table);
        }
        if (saveConfirm instanceof HTMLButtonElement) saveConfirm.disabled = false;
      } catch (err) {
        saveDlg?.close();
        if (alertMessage) alertMessage.textContent = err instanceof Error ? err.message : "再計算内容を取得できません";
        alertDlg?.showModal();
      }
    };
    document.getElementById("settings-save-open")?.addEventListener("click", showSavePreview);
    document.getElementById("settings-save-cancel")?.addEventListener("click", () => saveDlg?.close());
    document.getElementById("settings-save-confirm")?.addEventListener("click", () => { saveDlg?.close(); settingsForm?.submit(); });
    document.getElementById("settings-alert-close")?.addEventListener("click", () => {
      alertDlg?.close();
      const target = focusAfterAlert;
      focusAfterAlert = null;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) window.setTimeout(() => target.focus(), 0);
    });
    alertDlg?.addEventListener("click", (ev) => { const box = alertDlg.getBoundingClientRect(); if (ev.clientX < box.left || ev.clientX > box.right || ev.clientY < box.top || ev.clientY > box.bottom) document.getElementById("settings-alert-close")?.click(); });
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
  return { body, scripts: scripts + bindDlgScript() };
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
  return `<tr class="${b.refunded ? "scr" : ""}" data-kind="${escapeHtml(b.kind)}" data-res="${res}" data-who="${escapeHtml(b.display_name)}" data-amt="${b.amount}">
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

