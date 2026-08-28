import type { StrategicSkillDismissedRow, StrategicSkillRow } from "./strategicSkills.ts";

export function strategicSkillsModalHtml(): string {
  return `<dialog class="modal strategic-dlg" id="strategic-dlg">
    <h2 id="strategic-dlg-title">戦略例外リスト</h2>
    <p class="note" id="strategic-dlg-note">U-tools 有効リスト外でも、ここで指定した点数を土台に加算します。</p>
    <div id="strategic-candidates-wrap" hidden>
      <p class="set-k">この頭の不採用（候補）</p>
      <div id="strategic-candidates"></div>
    </div>
    <div id="strategic-registered-wrap">
      <p class="set-k" style="margin-top:.85rem">登録済み</p>
      <div class="strategic-table-wrap table-scroll">
        <table class="plain strategic-table" id="strategic-table">
          <thead><tr><th>名前</th><th>id</th><th class="num">点</th><th>メモ</th><th></th></tr></thead>
          <tbody id="strategic-tbody"></tbody>
        </table>
      </div>
    </div>
    <div id="strategic-add-wrap">
      <p class="set-k" style="margin-top:.85rem">手動追加</p>
      <div class="strategic-add-form">
        <label>名前<input id="strategic-add-name" autocomplete="off"></label>
        <label>id<input id="strategic-add-id" inputmode="numeric" autocomplete="off"></label>
        <label>点<input id="strategic-add-points" type="number" min="0" step="1" value="1"></label>
        <label>メモ<input id="strategic-add-memo" autocomplete="off"></label>
        <button type="button" id="strategic-add-btn">追加</button>
      </div>
    </div>
    <div class="modal-actions modal-actions--split">
      <a href="/admin/api/strategic-skills/export" id="strategic-export" download>JSON export</a>
      <button type="button" class="admin-action admin-action--secondary" id="strategic-close">閉じる</button>
    </div>
  </dialog>`;
}

export function heroUtilBarHtml(
  strategicCount: number,
  canSetup: boolean,
): string {
  const strategicBtn = canSetup
    ? `<button type="button" class="admin-action admin-action--secondary" id="strategic-open">戦略例外（${strategicCount}）</button>`
    : `<button type="button" class="admin-action admin-action--secondary" id="strategic-open" disabled>戦略例外（${strategicCount}）</button>`;
  const keyBlock = canSetup
    ? `<span class="hero-util-sep" aria-hidden="true">│</span>
       <span class="hero-key-wrap" id="hero-key-wrap">
         <span class="hero-key-label">OCRキー</span>
         <span id="hero-key-saved" hidden>
           <span class="hero-key-mask" id="hero-key-mask"></span>
           <button type="button" id="gemini-clear">消</button>
         </span>
         <span id="hero-key-edit">
           <input id="gemini-key" type="text" autocomplete="off" spellcheck="false" aria-label="Gemini API キー">
           <button type="button" id="gemini-save">保存</button>
         </span>
       </span>`
    : "";
  return `<div class="hero-util">${strategicBtn}${keyBlock}</div>`;
}

/** モーダル操作用スクリプト（ocrAdmin のキー UI と連携） */
export function strategicSkillsAdminScript(
  canEdit: boolean,
  initial: { skills: StrategicSkillRow[]; dismissed: StrategicSkillDismissedRow[] },
): string {
  return `<script>
(function () {
  const CAN_EDIT = ${canEdit ? "true" : "false"};
  let skills = ${JSON.stringify(initial.skills)};
  let dismissed = ${JSON.stringify(initial.dismissed)};
  let modalMode = "full";
  const dlg = document.getElementById("strategic-dlg");
  const openBtn = document.getElementById("strategic-open");
  const tbody = document.getElementById("strategic-tbody");
  const candWrap = document.getElementById("strategic-candidates-wrap");
  const candEl = document.getElementById("strategic-candidates");
  const countEl = document.getElementById("strategic-open");
  const titleEl = document.getElementById("strategic-dlg-title");
  const registeredWrap = document.getElementById("strategic-registered-wrap");
  const addWrap = document.getElementById("strategic-add-wrap");
  const exportEl = document.getElementById("strategic-export");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function attrEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function dismissedSet() {
    return new Set(dismissed.map((d) => d.skillId));
  }
  function skillMap() {
    return new Map(skills.map((s) => [s.skillId, s]));
  }
  function updateOpenLabel() {
    if (countEl) countEl.textContent = "戦略例外（" + skills.length + "）";
    document.dispatchEvent(new CustomEvent("strategic-skills-changed", { detail: { skills, dismissed } }));
  }
  function bindBackdropClose() {
    if (!dlg || dlg.dataset.backdropBound === "1") return;
    dlg.dataset.backdropBound = "1";
    dlg.addEventListener("click", (ev) => {
      const r = dlg.getBoundingClientRect();
      const inside =
        ev.clientX >= r.left && ev.clientX <= r.right &&
        ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }
  function setModalMode(mode) {
    modalMode = mode;
    const candidatesOnly = mode === "candidates";
    if (titleEl) titleEl.textContent = candidatesOnly ? "例外に追加" : "戦略例外リスト";
    if (registeredWrap) registeredWrap.hidden = candidatesOnly;
    if (addWrap) addWrap.hidden = candidatesOnly || !CAN_EDIT;
    if (exportEl) exportEl.hidden = candidatesOnly;
  }
  function afterCandidateAction(list) {
    const remaining = filterCandidates(list);
    if (modalMode === "candidates") {
      if (remaining.length) openCandidatesOnly(list);
      else dlg?.close();
    } else {
      showCandidates(list);
    }
  }
  async function api(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "操作に失敗しました");
    }
    return res.json().catch(() => ({}));
  }
  async function reload() {
    const data = await api("GET", "/admin/api/strategic-skills");
    skills = data.skills || [];
    dismissed = data.dismissed || [];
    renderTable();
    updateOpenLabel();
    if (window.__paintMaterials) window.__paintMaterials();
  }
  function renderTable() {
    if (!tbody) return;
    if (!skills.length) {
      tbody.innerHTML = '<tr><td colspan="5">まだありません</td></tr>';
      return;
    }
    tbody.innerHTML = skills.map((s) =>
      "<tr><td>" + esc(s.name) + "</td><td>" + s.skillId + '</td><td class="num">' + s.points +
      "</td><td>" + esc(s.memo || "") + "</td><td>" +
      (CAN_EDIT ? '<button type="button" class="danger strategic-del" data-id="' + s.skillId + '">削除</button>' : "") +
      "</td></tr>"
    ).join("");
    tbody.querySelectorAll(".strategic-del").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("例外リストから削除しますか？")) return;
        await api("DELETE", "/admin/api/strategic-skills?id=" + encodeURIComponent(btn.getAttribute("data-id")));
        await reload();
      });
    });
  }
  function filterCandidates(list) {
    const ds = dismissedSet();
    const sm = skillMap();
    return (list || []).filter((h) => h.id != null && !sm.has(h.id) && !ds.has(h.id));
  }
  function showCandidates(list) {
    if (!candWrap || !candEl) return [];
    const items = filterCandidates(list);
    if (!items.length) {
      candWrap.hidden = true;
      candEl.innerHTML = "";
      return items;
    }
    candWrap.hidden = false;
    candEl.innerHTML = items.map((h) =>
      '<div class="strategic-cand-row" data-id="' + h.id + '" data-name="' + attrEsc(h.name) + '">' +
        '<div class="strategic-cand-head">' + esc(h.name) + ' <span class="odds-meta">id ' + h.id + '</span></div>' +
        (CAN_EDIT
          ? '<div class="strategic-cand-fields">' +
              '<label class="strategic-cand-field">点<input type="number" class="strategic-cand-pts" min="0" step="1" value="1"></label>' +
              '<label class="strategic-cand-field strategic-cand-memo-field">メモ<input type="text" class="strategic-cand-memo" autocomplete="off"></label>' +
              '<button type="button" class="strategic-cand-add">追加</button>' +
              '<button type="button" class="secondary strategic-cand-dismiss">見送り</button>' +
            '</div>'
          : "") +
      '</div>'
    ).join("");
    candEl.querySelectorAll(".strategic-cand-row").forEach((row) => {
      row.querySelector(".strategic-cand-add")?.addEventListener("click", async () => {
        const id = Number(row.getAttribute("data-id"));
        const name = row.getAttribute("data-name") || "";
        const pointsRaw = row.querySelector(".strategic-cand-pts")?.value;
        const points = pointsRaw === "" || pointsRaw == null ? 1 : Number(pointsRaw);
        const memo = row.querySelector(".strategic-cand-memo")?.value || "";
        try {
          await api("POST", "/admin/api/strategic-skills", { skillId: id, name, points, memo });
          await reload();
          afterCandidateAction(list);
        } catch (e) {
          alert(e.message || "追加できませんでした");
        }
      });
      row.querySelector(".strategic-cand-dismiss")?.addEventListener("click", async () => {
        try {
          await api("POST", "/admin/api/strategic-skills/dismiss", {
            skillId: Number(row.getAttribute("data-id")),
            name: row.getAttribute("data-name") || "",
          });
          await reload();
          afterCandidateAction(list);
        } catch (e) {
          alert(e.message || "見送りに失敗しました");
        }
      });
    });
    return items;
  }
  function openFull() {
    setModalMode("full");
    renderTable();
    showCandidates(window.__lastRejected || []);
    bindBackdropClose();
    dlg?.showModal();
  }
  function openCandidatesOnly(rejected) {
    setModalMode("candidates");
    const items = showCandidates(rejected);
    if (!items.length) {
      alert("追加できる候補がありません");
      return;
    }
    bindBackdropClose();
    dlg?.showModal();
  }
  openBtn?.addEventListener("click", () => openFull());
  document.getElementById("strategic-close")?.addEventListener("click", () => dlg?.close());
  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id === "strategic-from-rejected" || t.closest("#strategic-from-rejected")) {
      openCandidatesOnly(window.__lastRejected || []);
    }
  });
  document.getElementById("strategic-add-btn")?.addEventListener("click", async () => {
    if (!CAN_EDIT) return;
    const name = document.getElementById("strategic-add-name")?.value;
    const id = Number(document.getElementById("strategic-add-id")?.value);
    const points = Number(document.getElementById("strategic-add-points")?.value);
    const memo = document.getElementById("strategic-add-memo")?.value || "";
    try {
      await api("POST", "/admin/api/strategic-skills", { skillId: id, name, points, memo });
      await reload();
    } catch (e) {
      alert(e.message || "追加できませんでした");
    }
  });
  if (!CAN_EDIT) {
    addWrap?.setAttribute("hidden", "");
    const note = document.getElementById("strategic-dlg-note");
    if (note) note.textContent = "投票開始後は閲覧のみです。";
  }
  bindBackdropClose();
  renderTable();
})();
</script>`;
}
