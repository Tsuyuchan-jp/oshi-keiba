import { escapeHtml } from "./http";
import { STYLE_OPTIONS, type HorseScoreInput } from "./horseScoreInput";
import { catalogJsonForPage, classifySkill } from "./skillCatalog";
import type { EventScoreSetup } from "./scoreSetup";
import { ALLOWED_SHOT_MIME } from "./shotMime";
import { greenSkillByName } from "./greenSkills";
import { skillCountsAsGoldLike, skillCountsInBase, TAMERAI_IDS } from "./score";
import {
  partitionSkills,
  strategicCandidates,
  strategicMapFromRows,
  type StrategicSkillRow,
} from "./strategicSkills";
import type { EffectiveSkillIdsByStyle } from "./utoolsEffects";
import type { Board } from "./store";

const KEY_LS = "oshi-keiba-gemini-key";
const SHOT_ACCEPT = ALLOWED_SHOT_MIME.join(",");

function aptChip(label: string, rank: string): string {
  const r = rank || "—";
  const s = r.toUpperCase() === "S" ? " s" : "";
  return `<span class="reg-chip${s}">${escapeHtml(label)} ${escapeHtml(r)}</span>`;
}

function skillChipClass(kind: string): string {
  if (kind === "green") return "green";
  if (kind === "evo" || kind === "scenario") return "evo";
  if (kind === "gold" || kind === "unique") return "gold";
  if (kind === "minus") return "minus";
  return "white";
}

function skillChipsHtml(
  items: { name: string; kind: string }[],
  emptyLabel: string,
): string {
  if (items.length === 0) {
    return `<span class="reg-chip">${escapeHtml(emptyLabel)}</span>`;
  }
  return items
    .map(
      (h) =>
        `<span class="reg-chip ${skillChipClass(h.kind)}">${escapeHtml(h.name)}</span>`,
    )
    .join("");
}

function strategicChipsHtml(
  items: { name: string; kind: string; points: number }[],
  emptyLabel: string,
): string {
  if (items.length === 0) {
    return `<span class="reg-chip">${escapeHtml(emptyLabel)}</span>`;
  }
  return items
    .map(
      (h) =>
        `<span class="reg-chip strategic">${escapeHtml(h.name)}<span class="reg-pts">+${escapeHtml(String(h.points))}</span></span>`,
    )
    .join("");
}

/** 読取材料のチップ。掛かりスタミナ2欄は出さない */
export function registerMaterialsHtml(
  input: HorseScoreInput,
  effectiveIds?: ReadonlySet<number> | null,
  strategicSkills: readonly StrategicSkillRow[] = [],
  dismissedIds: ReadonlySet<number> = new Set(),
  canEditStrategic = false,
): string {
  const st = input.stats;
  const ap = input.aptitudes;
  const accepted: { name: string; kind: string; id: number | null }[] = [];
  for (let i = 0; i < input.skillNames.length; i++) {
    const name = input.skillNames[i]!;
    const id = input.skillIds[i] ?? null;
    const c = classifySkill(name, id);
    accepted.push({ name: c.name || name, kind: c.kind, id: c.id ?? id });
  }
  const strategicById = strategicMapFromRows(strategicSkills);
  const parts = partitionSkills(accepted, { effectiveIds, strategicById });
  const goldLike = parts.effective.filter((h) =>
    skillCountsAsGoldLike(h.name, h.id),
  ).length;
  const cand = strategicCandidates(parts.rejected, strategicById, dismissedIds);
  const rejectedLink =
    canEditStrategic && cand.length
      ? ` <button type="button" class="linkish" id="strategic-from-rejected">例外に追加…</button>`
      : "";
  const skipped = (input.skippedSkillNames ?? []).map((n) => ({
    name: n,
    kind: "unknown",
  }));

  return `    <div class="reg-stats">
      <div class="reg-stat"><span class="k">速</span><span class="v">${st.speed}</span></div>
      <div class="reg-stat"><span class="k">スタ</span><span class="v">${st.stamina}</span></div>
      <div class="reg-stat"><span class="k">パ</span><span class="v">${st.power}</span></div>
      <div class="reg-stat"><span class="k">根</span><span class="v">${st.guts}</span></div>
      <div class="reg-stat"><span class="k">賢</span><span class="v">${st.wisdom}</span></div>
    </div>
    <p class="set-k" style="margin-top:.85rem">適性</p>
    <div class="reg-chips">
      ${aptChip("芝", ap.turf)}${aptChip("ダ", ap.dirt)}
      <span class="reg-slash" aria-hidden="true">/</span>
      ${aptChip("短", ap.short)}${aptChip("マイル", ap.mile)}${aptChip("中", ap.medium)}${aptChip("長", ap.long)}
      <span class="reg-slash" aria-hidden="true">/</span>
      ${aptChip("逃げ", ap.nige)}${aptChip("先行", ap.senkou)}${aptChip("差し", ap.sashi)}${aptChip("追込", ap.oikomi)}
    </div>
    <p class="set-k" style="margin-top:.85rem">有効スキル（総有効スキル数 ${parts.effective.length} / 金相当スキル数 ${goldLike}）</p>
    <div class="reg-chips">${skillChipsHtml(parts.effective, "なし")}</div>
    <p class="set-k" style="margin-top:.85rem">戦略例外スキル（合計 ${parts.strategicPoints} 点）</p>
    <div class="reg-chips">${strategicChipsHtml(parts.strategic, "なし")}</div>
    <p class="set-k" style="margin-top:.85rem">緑スキル</p>
    <div class="reg-chips">${skillChipsHtml(parts.greens, "なし")}</div>
    <p class="set-k" style="margin-top:.85rem">不採用スキル${rejectedLink}</p>
    <div class="reg-chips">${skillChipsHtml(parts.rejected, "なし")}</div>
    <p class="set-k" style="margin-top:.85rem">OCR落ちスキル</p>
    <div class="reg-chips">${skillChipsHtml(skipped, "なし")}</div>`;
}

export function horsesAdminBody(
  _board: Board,
  canSetup: boolean,
  _scoreSetup: EventScoreSetup | null,
  _opts?: { embedded?: boolean },
): string {
  if (!canSetup) {
    return `<p class="reg-locked">投票開始後は出走を足せません。直しと内訳は出走タブ。</p>`;
  }
  const styleBtns = [
    ["runner", "逃げ"],
    ["leader", "先行"],
    ["betweener", "差し"],
    ["chaser", "追込"],
  ]
    .map(([k, lab]) => `<button type="button" data-s="${k}">${lab}</button>`)
    .join("");
  const styleOpts = [
    `<option value="">未選択</option>`,
    ...STYLE_OPTIONS.map(
      (o) => `<option value="${o.key}">${escapeHtml(o.label)}</option>`,
    ),
  ].join("");
  // ドロップと見える file は table-scroll の外。透明オーバーレイは使わない
  return `<form id="horse-add" method="post" action="/admin/horse" enctype="multipart/form-data" data-mode="idle">
        <input type="hidden" name="ocr_ok" id="ocr-ok" value="">
        <input type="hidden" name="score_input" id="score-input" value="">
        <input type="hidden" name="dress_name" id="dress-name" value="">
        <input type="file" name="shot" id="shot-from-ocr" class="admin-offscreen" accept="${SHOT_ACCEPT}" tabindex="-1">
        <input id="ocr-file" class="admin-offscreen" type="file" accept="${SHOT_ACCEPT}" tabindex="-1">
        <select name="style_key" id="style-key" class="admin-offscreen" tabindex="-1">${styleOpts}</select>
        <div id="mode-idle">
          <div class="reg-drop" id="ocr-drop" role="button" tabindex="0">
            <div class="reg-drop-idle">
              <strong>完成スクショを置く</strong>
              <p>クリックで選ぶか、ここにドロップ。PNG / JPEG / WebP。</p>
            </div>
            <div class="reg-drop-picked">
              <img class="reg-drop-thumb" id="ocr-drop-img" alt="">
              <div>
                <strong id="ocr-drop-name">画像を選びました</strong>
                <p>クリックで差し替え</p>
              </div>
            </div>
          </div>
          <p class="reg-alt"><button type="button" id="to-manual">スクショなしで直置きする</button></p>
          <div class="reg-cue" id="ocr-cue" hidden>
            <p id="ocr-status"></p>
          </div>
          <div class="ctas">
            <button type="button" id="ocr-run">読み取る</button>
            <button type="button" id="ocr-stop">停止</button>
          </div>
        </div>
        <div class="table-scroll" id="mode-work">
          <div class="reg-bench">
            <div>
              <button type="button" class="reg-shot-btn" id="shot-open" aria-label="スクショを大きく見る">
                <img class="reg-shot" id="reg-shot-img" alt=""></button>
              <div class="reg-shot empty" id="reg-shot-empty">スクショなし</div>
            </div>
            <div>
              <div class="reg-names">
                <label>ウマ娘名<input name="uma_name" id="uma-name" required maxlength="40"></label>
                <label>出走者<input name="runner_name" id="runner-name" required maxlength="40"></label>
              </div>
              <p class="set-k" style="margin-top:.85rem">出走脚質</p>
              <div class="set-seg" id="styles">${styleBtns}</div>
              <div id="ocr-materials"></div>
              <div id="manual-block">
                <div class="reg-score-row">
                  <span class="reg-score-auto">自動算出</span>
                  <div class="reg-score-in">
                    <label>評価点（直置き）<input name="strength" id="strength" type="number" min="0" step="0.1" value="10"></label>
                  </div>
                  <label class="reg-manual-toggle" for="strength-manual">
                    <input class="admin-offscreen" type="checkbox" name="strength_manual" id="strength-manual" value="1">
                    <span class="reg-manual-pill">評価点を直置き</span>
                  </label>
                </div>
              </div>
              <div class="ctas">
                <button type="submit" class="primary" id="do-add">登録</button>
                <button type="button" id="do-idle">画像をやり直す</button>
              </div>
            </div>
          </div>
        </div>
      </form>`;
}

/** ブラウザ用。カタログ＋Dice ファジーでスキルを ID 化する */
export function ocrAdminScript(
  canAutoScore: boolean,
  effectiveByStyle: EffectiveSkillIdsByStyle | null = null,
  greenNames: readonly string[] = [],
  strategicSkills: readonly StrategicSkillRow[] = [],
  dismissedIds: readonly number[] = [],
  canEditStrategic = true,
): string {
  const catalog = catalogJsonForPage();
  return `<script>
(function () {
  const KEY_LS = ${JSON.stringify(KEY_LS)};
  const CATALOG = ${catalog};
  const CAN_AUTO = ${canAutoScore ? "true" : "false"};
  const CAN_EDIT_STRATEGIC = ${canEditStrategic ? "true" : "false"};
  const EFFECTIVE_BY_STYLE = ${JSON.stringify(effectiveByStyle)};
  const GREEN_NAMES = new Set(${JSON.stringify([...greenNames])});
  let STRATEGIC = ${JSON.stringify(strategicSkills)};
  let DISMISSED = new Set(${JSON.stringify([...dismissedIds])});
  const TAMERAI_IDS = new Set(${JSON.stringify([...TAMERAI_IDS])});
  const TAMERAI_NAMES = new Set(["逃げためらい","先行ためらい","差しためらい","追込ためらい"]);
  const FUZZY_TH = 0.45;
  const KIND_JA = { green: "緑", gold: "金", white: "白", unique: "固有", evo: "進化", scenario: "シナリオ", minus: "デバフ", inherit: "継承", special: "特殊", rare: "金", normal: "白", unknown: "未分類" };
  // skillFuzzy.ts と同期: エイリアス・千.万.骨格・編集距離≤1・同名の unique/inherit/継承進化
  const ALIAS = {
    "千銀万錬": "千鍛万錬",
    "千段万錬": "千鍛万錬",
    "千錬万錬": "千鍛万錬",
    "千鍬万鐘": "千鍛万錬",
    "千客万来": "千鍛万錬",
    "千紫万紅": "千鍛万錬",
    "勝利へ至る累積": "勝利ヘ至ル累積",
  };
  const SENMAN = "千鍛万錬";
  const SENMAN_RE = /^千.万.$/;
  const STYLE_LABEL = { runner: "逃", leader: "先", betweener: "差", chaser: "追" };
  const skills = (CATALOG.skills || []).filter((s) => typeof s.id === "number");
  const byName = new Map();
  for (const s of skills) {
    const list = byName.get(s.name) || [];
    list.push(s);
    byName.set(s.name, list);
  }
  const names = [...byName.keys()];
  function toHalf(str) {
    let s = str.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    return s.replace(/〇/g, "○");
  }
  function norm(s) { return toHalf(String(s || "").replace(/[\\s\\u3000]+/g, "")); }
  function applySenman(clean) {
    if (!SENMAN_RE.test(clean)) return clean;
    if (names.some((n) => norm(n) === clean)) return clean;
    return SENMAN;
  }
  function dice(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const map = new Map();
    for (let i = 0; i < a.length - 1; i++) {
      const bg = a.slice(i, i + 2);
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    let hits = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const bg = b.slice(i, i + 2);
      const c = map.get(bg) || 0;
      if (c > 0) { map.set(bg, c - 1); hits++; }
    }
    return (2 * hits) / (a.length - 1 + (b.length - 1));
  }
  function editDist(a, b) {
    if (a === b) return 0;
    const n = a.length, m = b.length;
    if (!n) return m;
    if (!m) return n;
    const prev = Array(m + 1);
    const cur = Array(m + 1);
    for (let j = 0; j <= m; j++) prev[j] = j;
    for (let i = 1; i <= n; i++) {
      cur[0] = i;
      for (let j = 1; j <= m; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= m; j++) prev[j] = cur[j];
    }
    return prev[m];
  }
  function isInheritEvo(skill, siblings) {
    return skill.kind === "special" && siblings.some((s) => s.kind === "inherit");
  }
  function pickSkill(matched, isFirst) {
    if (!matched.length) return null;
    if (matched.length === 1) {
      const only = matched[0];
      if (!isFirst && only.kind === "unique") return null;
      return only;
    }
    if (isFirst) return matched.find((s) => s.kind === "unique") || matched[0];
    const evo = matched.find((s) => isInheritEvo(s, matched));
    if (evo) return evo;
    return matched.find((s) => s.kind !== "unique") || null;
  }
  function fuzzyOne(raw, isFirst) {
    let clean = norm(raw);
    if (!clean) return null;
    clean = ALIAS[clean] || clean;
    clean = applySenman(clean);
    let editBest = null;
    let editD = Infinity;
    let editR = -1;
    for (const name of names) {
      const n = norm(name);
      const d = editDist(clean, n);
      if (d > 1) continue;
      const r = dice(clean, n);
      if (d < editD || (d === editD && r > editR)) {
        editD = d;
        editR = r;
        editBest = name;
      }
    }
    let best = editBest;
    let bestR = editBest != null
      ? (editD === 0 ? 1 : Math.max(editR, FUZZY_TH))
      : -1;
    const ratings = [];
    if (!editBest) {
      for (const name of names) {
        const r = dice(clean, norm(name));
        ratings.push({ name, r });
        if (r > bestR) { bestR = r; best = name; }
      }
      const suf = clean.slice(-1);
      if (["○","◎","×"].includes(suf)) {
        const hit = ratings.filter((x) => x.name.endsWith(suf) && x.r > 0.4).sort((a,b) => b.r - a.r)[0];
        if (hit) { best = hit.name; bestR = hit.r; }
      }
    }
    if (!best || bestR < FUZZY_TH) return { input: raw, name: best || "", id: null, kind: "unknown", rating: bestR < 0 ? 0 : bestR, ok: false };
    const matched = byName.get(best) || [];
    const pick = pickSkill(matched, isFirst);
    if (!pick) return { input: raw, name: best, id: null, kind: "unknown", rating: bestR, ok: false };
    return { input: raw, name: pick.name, id: pick.id, kind: pick.kind, rating: bestR, ok: true };
  }
  function aptRank(v) {
    const s = String(v || "").trim().toUpperCase();
    if (s === "5") return "S";
    if (s === "4") return "A";
    if (s === "8") return "B";
    if (s === "6" || s === "0") return "G";
    return s;
  }
  function soleStyle(ap) {
    const pairs = [["runner", ap.nige], ["leader", ap.senkou], ["betweener", ap.sashi], ["chaser", ap.oikomi]];
    const hits = pairs.filter(([, r]) => String(r).toUpperCase() === "S");
    return hits.length === 1 ? hits[0][0] : "";
  }

  function pickGeminiKey(raw) {
    const s = String(raw || "").trim();
    const m = s.match(/AIza[0-9A-Za-z_-]+/);
    return m ? m[0] : s;
  }
  const keyInput = document.getElementById("gemini-key");
  const keySaved = document.getElementById("hero-key-saved");
  const keyEdit = document.getElementById("hero-key-edit");
  const keyMask = document.getElementById("hero-key-mask");
  function maskKey(k) {
    if (!k) return "";
    const head = k.startsWith("AIza") ? "AIza" : k.slice(0, 4);
    const rest = Math.max(4, Math.min(28, k.length - head.length));
    return head + "•".repeat(rest);
  }
  function showKeyState(saved) {
    if (keySaved) keySaved.hidden = !saved;
    if (keyEdit) keyEdit.hidden = saved;
    if (saved && keyMask) {
      keyMask.textContent = maskKey(localStorage.getItem(KEY_LS) || "");
    }
    if (!saved && keyInput) keyInput.value = "";
  }
  const storedKey = pickGeminiKey(localStorage.getItem(KEY_LS) || "");
  if (storedKey) localStorage.setItem(KEY_LS, storedKey);
  showKeyState(!!storedKey);
  document.getElementById("gemini-save")?.addEventListener("click", () => {
    const v = pickGeminiKey(keyInput?.value);
    if (!v) { say("キーを入力してください"); return; }
    localStorage.setItem(KEY_LS, v);
    showKeyState(true);
    say("キーをこのブラウザに保存しました。");
  });
  document.getElementById("gemini-clear")?.addEventListener("click", () => {
    localStorage.removeItem(KEY_LS);
    showKeyState(false);
    say("キーを消しました。");
  });
  document.addEventListener("strategic-skills-changed", (ev) => {
    STRATEGIC = (ev.detail && ev.detail.skills) || [];
    DISMISSED = new Set(((ev.detail && ev.detail.dismissed) || []).map((d) => d.skillId));
    paintMaterials();
  });
  const statusEl = document.getElementById("ocr-status");
  const scoreInputEl = document.getElementById("score-input");
  const styleEl = document.getElementById("style-key");
  const strengthEl = document.getElementById("strength");
  const manualEl = document.getElementById("strength-manual");
  const formEl = document.getElementById("horse-add");
  const fileEl = document.getElementById("ocr-file");
  const cueEl = document.getElementById("ocr-cue");
  function say(msg) {
    if (statusEl) statusEl.textContent = msg;
    if (cueEl) cueEl.hidden = !msg;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function chipKind(kind) {
    if (kind === "green") return "green";
    if (kind === "evo" || kind === "scenario") return "evo";
    if (kind === "gold" || kind === "unique" || kind === "rare") return "gold";
    if (kind === "minus") return "minus";
    return "white";
  }
  function aptChip(lab, rank) {
    const r = String(rank || "—");
    const s = r.toUpperCase() === "S" ? " s" : "";
    return '<span class="reg-chip' + s + '">' + esc(lab) + " " + esc(r) + "</span>";
  }
  document.getElementById("to-manual")?.addEventListener("click", () => {
    if (manualEl) manualEl.checked = true;
    setMode("manual");
    strengthEl?.focus();
  });
  function paintStyleBtns() {
    document.getElementById("styles")?.querySelectorAll("[data-s]").forEach((b) => {
      b.classList.toggle("on", b.dataset.s === (styleEl && styleEl.value));
    });
  }
  function countsInBase(name, id, kind) {
    const n = String(name || "").trim();
    if (!n) return false;
    if (GREEN_NAMES.has(n)) return false;
    if (TAMERAI_NAMES.has(n) || (id != null && TAMERAI_IDS.has(id))) return true;
    if (kind === "unique" || kind === "evo" || kind === "scenario") return true;
    const style = styleEl && styleEl.value;
    const list = style && EFFECTIVE_BY_STYLE ? EFFECTIVE_BY_STYLE[style] : null;
    if (list && list.length) return id != null && list.indexOf(id) >= 0;
    return true;
  }
  function chipsHtml(items, emptyLabel, skipClass) {
    if (!items.length) return '<span class="reg-chip">' + esc(emptyLabel) + "</span>";
    return items.map((h) =>
      '<span class="reg-chip ' + (skipClass || chipKind(h.kind)) + '">' + esc(h.name) + "</span>"
    ).join("");
  }
  function strategicMap() {
    return new Map(STRATEGIC.map((s) => [s.skillId, s]));
  }
  function partitionOkHits(okHits) {
    const sm = strategicMap();
    const effective = [];
    const strategic = [];
    const greens = [];
    const rejected = [];
    let strategicPoints = 0;
    for (const h of okHits) {
      const id = h.id;
      if (id != null && sm.has(id)) {
        const row = sm.get(id);
        strategic.push(Object.assign({}, h, { points: row.points }));
        strategicPoints += row.points;
        continue;
      }
      const n = String(h.name || "").trim();
      if (GREEN_NAMES.has(n)) { greens.push(h); continue; }
      if (countsInBase(h.name, h.id, h.kind)) { effective.push(h); continue; }
      rejected.push(h);
    }
    return { effective, strategic, greens, rejected, strategicPoints };
  }
  function strategicChipsHtml(items) {
    if (!items.length) return '<span class="reg-chip">なし</span>';
    return items.map((h) =>
      '<span class="reg-chip strategic">' + esc(h.name) + '<span class="reg-pts">+' + esc(String(h.points)) + "</span></span>"
    ).join("");
  }
  function rejectedLinkHtml(rejected) {
    window.__lastRejected = rejected;
    const sm = strategicMap();
    const cand = rejected.filter((h) => h.id != null && !sm.has(h.id) && !DISMISSED.has(h.id));
    if (!CAN_EDIT_STRATEGIC || !cand.length) return "";
    return ' <button type="button" class="linkish" id="strategic-from-rejected">例外に追加…</button>';
  }

  let ac = null;
  let ocrShot = null;
  /** @type {File | null} */
  let heldFile = null;
  /** @type {any} */
  let draft = null;
  let shotUrl = null;
  /** @type {any[]} */
  let lastHits = [];

  function paintMaterials() {
    const el = document.getElementById("ocr-materials");
    if (!el) return;
    if (!draft) { el.innerHTML = ""; return; }
    const st = draft.stats;
    const ap = draft.aptitudes;
    const okHits = lastHits.filter((h) => h.ok);
    const missHits = lastHits.filter((h) => !h.ok);
    const parts = partitionOkHits(okHits);
    const goldLike = parts.effective.filter((h) => {
      const n = String(h.name || "").trim();
      if (h.kind === "gold") return true;
      if (h.kind === "unique" || h.kind === "evo" || h.kind === "scenario") {
        return !GREEN_NAMES.has(n);
      }
      return false;
    }).length;
    const ocrMiss = missHits.map((h) => ({ name: h.input, kind: "unknown" }));
    const rejLink = rejectedLinkHtml(parts.rejected);
    el.innerHTML =
      '<div class="reg-stats">' +
        '<div class="reg-stat"><span class="k">速</span><span class="v">' + esc(st.speed) + "</span></div>" +
        '<div class="reg-stat"><span class="k">スタ</span><span class="v">' + esc(st.stamina) + "</span></div>" +
        '<div class="reg-stat"><span class="k">パ</span><span class="v">' + esc(st.power) + "</span></div>" +
        '<div class="reg-stat"><span class="k">根</span><span class="v">' + esc(st.guts) + "</span></div>" +
        '<div class="reg-stat"><span class="k">賢</span><span class="v">' + esc(st.wisdom) + "</span></div>" +
      "</div>" +
      '<p class="set-k" style="margin-top:.85rem">適性</p>' +
      '<div class="reg-chips">' +
        aptChip("芝", ap.turf) + aptChip("ダ", ap.dirt) +
        '<span class="reg-slash" aria-hidden="true">/</span>' +
        aptChip("短", ap.short) + aptChip("マイル", ap.mile) + aptChip("中", ap.medium) + aptChip("長", ap.long) +
        '<span class="reg-slash" aria-hidden="true">/</span>' +
        aptChip("逃げ", ap.nige) + aptChip("先行", ap.senkou) + aptChip("差し", ap.sashi) + aptChip("追込", ap.oikomi) +
      "</div>" +
      '<p class="set-k" style="margin-top:.85rem">有効スキル（総有効スキル数 ' + parts.effective.length + " / 金相当スキル数 " + goldLike + "）</p>" +
      '<div class="reg-chips">' + chipsHtml(parts.effective, "なし") + "</div>" +
      '<p class="set-k" style="margin-top:.85rem">戦略例外スキル（合計 ' + parts.strategicPoints + " 点）</p>" +
      '<div class="reg-chips">' + strategicChipsHtml(parts.strategic) + "</div>" +
      '<p class="set-k" style="margin-top:.85rem">緑スキル</p>' +
      '<div class="reg-chips">' + chipsHtml(parts.greens, "なし") + "</div>" +
      '<p class="set-k" style="margin-top:.85rem">不採用スキル' + rejLink + "</p>" +
      '<div class="reg-chips">' + chipsHtml(parts.rejected, "なし") + "</div>" +
      '<p class="set-k" style="margin-top:.85rem">OCR落ちスキル</p>' +
      '<div class="reg-chips">' + chipsHtml(ocrMiss, "なし", "skip") + "</div>";
  }
  window.__paintMaterials = paintMaterials;
  function showHeldPreview(file) {
    const dropImg = document.getElementById("ocr-drop-img");
    const readImg = document.getElementById("reg-shot-img");
    const drop = document.getElementById("ocr-drop");
    const nameEl = document.getElementById("ocr-drop-name");
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = file ? URL.createObjectURL(file) : null;
    if (dropImg) dropImg.src = shotUrl || "";
    if (readImg) readImg.src = shotUrl || "";
    drop?.classList.toggle("has-file", !!file);
    if (nameEl) nameEl.textContent = file ? (file.name || "画像を選びました") : "";
  }
  function setMode(mode) {
    if (!formEl) return;
    formEl.dataset.mode = mode;
    const title = document.getElementById("bench-title");
    const meta = document.getElementById("bench-meta");
    const addBtn = document.getElementById("do-add");
    const retry = document.getElementById("do-idle");
    if (mode === "idle") {
      if (title) title.textContent = "次の1頭";
      if (meta) meta.textContent = "選ぶ → 読む → 登録";
    } else if (mode === "read") {
      if (title) title.textContent = "読取の確認";
      if (meta) meta.textContent = "ウマ娘は OCR。出走者は手入力";
      if (addBtn) addBtn.textContent = "登録";
      if (retry) retry.textContent = "画像をやり直す";
    } else {
      if (title) title.textContent = "直置き";
      if (meta) meta.textContent = "スクショは残らない";
      if (addBtn) addBtn.textContent = "直置きで登録";
      if (retry) retry.textContent = "スクショから読む";
    }
    paintStyleBtns();
    updateHint();
  }
  function resetToIdle() {
    draft = null;
    lastHits = [];
    ocrShot = null;
    heldFile = null;
    showHeldPreview(null);
    const flag = document.getElementById("ocr-ok");
    const slot = document.getElementById("shot-from-ocr");
    if (flag) flag.value = "";
    if (slot) slot.value = "";
    if (manualEl) manualEl.checked = false;
    setMode("idle");
    syncScoreInput();
    paintMaterials();
    clearOcrFileInput();
  }

  function syncScoreInput() {
    if (!scoreInputEl) return;
    if (!draft) { scoreInputEl.value = ""; updateHint(); return; }
    const style = styleEl?.value || null;
    const payload = {
      stats: draft.stats,
      aptitudes: draft.aptitudes,
      skillNames: draft.skillNames,
      skillIds: draft.skillIds,
      skippedSkillNames: draft.skippedSkillNames || [],
      styleKey: style || null,
    };
    scoreInputEl.value = JSON.stringify(payload);
    updateHint();
  }
  function updateHint() {
    const manual = !!(manualEl && manualEl.checked);
    formEl?.classList.toggle("need-score", !!(formEl && (formEl.dataset.mode === "manual" || (formEl.dataset.mode === "read" && (!CAN_AUTO || manual)))));
    if (strengthEl) {
      const need = formEl && (formEl.dataset.mode === "manual" || (formEl.dataset.mode === "read" && (!CAN_AUTO || manual)));
      strengthEl.required = !!need;
    }
  }
  styleEl?.addEventListener("change", () => {
    syncScoreInput();
    paintMaterials();
  });
  document.getElementById("styles")?.querySelectorAll("[data-s]").forEach((b) => {
    b.addEventListener("click", () => {
      if (styleEl) styleEl.value = b.dataset.s || "";
      paintStyleBtns();
      styleEl?.dispatchEvent(new Event("change"));
    });
  });
  manualEl?.addEventListener("change", updateHint);

  document.getElementById("ocr-stop")?.addEventListener("click", () => {
    if (ac) ac.abort();
  });
  function attachOcrShot(file) {
    ocrShot = file;
    const slot = document.getElementById("shot-from-ocr");
    const flag = document.getElementById("ocr-ok");
    if (flag) flag.value = "1";
    if (slot && typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      dt.items.add(file);
      slot.files = dt.files;
    }
  }
  function cleanJson(str) {
    const start = str.indexOf("{");
    if (start < 0) throw new Error("JSONがありません");
    let candidate = str.slice(start).trim();
    let last = candidate.lastIndexOf("}");
    while (last !== -1) {
      try { return JSON.parse(candidate.slice(0, last + 1)); } catch {}
      candidate = candidate.slice(0, last);
      last = candidate.lastIndexOf("}");
    }
    throw new Error("JSONを直せませんでした");
  }
  function resolveShotMime(file) {
    let t = String(file.type || "").trim().toLowerCase();
    if (t === "image/jpg") t = "image/jpeg";
    if (!t) {
      const n = String(file.name || "").toLowerCase();
      if (n.endsWith(".webp")) t = "image/webp";
      else if (n.endsWith(".png")) t = "image/png";
      else if (n.endsWith(".jpg") || n.endsWith(".jpeg")) t = "image/jpeg";
    }
    const ok = ${JSON.stringify([...ALLOWED_SHOT_MIME])};
    return ok.includes(t) ? t : null;
  }
  async function runOcr(file) {
    const apiKey = pickGeminiKey(keyInput?.value || localStorage.getItem(KEY_LS) || "");
    if (!apiKey) { say("キーを入れてください。ヒーロー右に貼って保存。"); return; }
    if (!file) { say("先に画像を選んでください。読み取るは読取だけです。"); return; }
    const mime = resolveShotMime(file);
    if (!mime) { say("対応形式は PNG / JPEG / WebP です。"); return; }
    say((file.name || "画像") + " を読み取り中…");
    ac = new AbortController();
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error("画像を読めませんでした"));
        r.readAsDataURL(file);
      });
      // MIME 追加に備えてプレフィックスは汎用で落とす
      const b64 = String(dataUrl).replace(/^data:[^;]+;base64,/, "");
      const instruction = "あなたはウマ娘の詳細ステータス画面を読む。JSONだけ返す。nameはウマ娘名（二つ名・ランクなし）。costumeNameは育成ウマ娘の角括弧内の衣装名（読めなければ空文字）。statsはspeed stamina power guts wisdomの整数。aptitudesはturf dirt short mile medium long nige senkou sashi oikomiのS〜G。skillsは取得スキル名を最後まで。緑も金もデバフ（右回り×等）も落とさない。";
      const payload = {
        system_instruction: { parts: { text: instruction } },
        contents: [{ parts: [
          { text: "この画像のステータスをJSONで抽出してください。" },
          { inline_data: { mime_type: mime, data: b64 } }
        ] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 8192 }
      };
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + encodeURIComponent(apiKey);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ac.signal });
      if (!res.ok) throw new Error("Gemini " + res.status + " " + await res.text());
      const body = await res.json();
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("応答が空です");
      let raw;
      try { raw = JSON.parse(text); } catch { raw = cleanJson(text); }
      const uma = (raw.name || "").trim();
      const dressName = (raw.costumeName || raw.dressName || "").trim();
      const umaEl = document.getElementById("uma-name");
      if (umaEl && uma) umaEl.value = uma;
      const dressEl = document.getElementById("dress-name");
      if (dressEl) dressEl.value = dressName;
      const rawSkills = Array.isArray(raw.skills) ? raw.skills.map(String) : [];
      const hits = rawSkills.map((s, i) => fuzzyOne(s, i === 0));
      const skillNames = [];
      const skillIds = [];
      const skippedSkillNames = [];
      for (const h of hits) {
        if (!h.ok) {
          if (h.input) skippedSkillNames.push(h.input);
          continue;
        }
        skillNames.push(h.name);
        skillIds.push(h.id);
      }
      const st = raw.stats || {};
      const apRaw = raw.aptitudes || {};
      const aptitudes = {
        turf: aptRank(apRaw.turf), dirt: aptRank(apRaw.dirt),
        short: aptRank(apRaw.short), mile: aptRank(apRaw.mile),
        medium: aptRank(apRaw.medium), long: aptRank(apRaw.long),
        nige: aptRank(apRaw.nige), senkou: aptRank(apRaw.senkou),
        sashi: aptRank(apRaw.sashi), oikomi: aptRank(apRaw.oikomi),
      };
      draft = {
        stats: {
          speed: Number(st.speed) || 0,
          stamina: Number(st.stamina) || 0,
          power: Number(st.power) || 0,
          guts: Number(st.guts) || 0,
          wisdom: Number(st.wisdom) || 0,
        },
        aptitudes,
        skillNames,
        skillIds,
        skippedSkillNames,
      };
      const sole = soleStyle(aptitudes);
      if (styleEl) styleEl.value = sole;
      paintStyleBtns();
      lastHits = hits;
      attachOcrShot(file);
      showHeldPreview(file);
      if (manualEl) manualEl.checked = false;
      syncScoreInput();
      paintMaterials();
      setMode("read");
      say((uma || file.name || "画像") + " を読みました。欄を確認して登録。");
      clearOcrFileInput();
    } catch (err) {
      const msg = (err && err.name === "AbortError") ? "停止しました。" : (err instanceof Error ? err.message : String(err));
      say(msg);
      clearOcrFileInput();
    }
  }
  function currentFile() {
    return heldFile || (fileEl && fileEl.files && fileEl.files[0]) || null;
  }
  function takeFile(file) {
    if (!file) { say("画像を受け取れませんでした。もう一度選んでください。"); return; }
    heldFile = file;
    showHeldPreview(file);
    say((file.name || "画像") + " を選びました。読み取るを押してください。");
  }
  function clearOcrFileInput() {
    if (fileEl) fileEl.value = "";
  }
  fileEl?.addEventListener("change", () => {
    const f = fileEl.files && fileEl.files[0];
    if (!f) { say("ファイルが空です。もう一度選んでください。"); return; }
    takeFile(f);
  });
  const drop = document.getElementById("ocr-drop");
  drop?.addEventListener("click", () => {
    fileEl?.click();
  });
  drop?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileEl?.click();
    }
  });
  drop?.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("is-over");
  });
  drop?.addEventListener("dragleave", (e) => {
    if (!drop.contains(e.relatedTarget)) drop.classList.remove("is-over");
  });
  drop?.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("is-over");
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) takeFile(f);
  });
  document.getElementById("ocr-run")?.addEventListener("click", () => {
    const f = currentFile();
    if (!f) {
      say("先に画像を選んでください。読み取るは読取だけです。");
      return;
    }
    runOcr(f);
  });
  document.getElementById("horse-add")?.addEventListener("submit", (ev) => {
    if (formEl && formEl.dataset.mode === "idle") {
      ev.preventDefault();
      return;
    }
    if (styleEl && !String(styleEl.value || "").trim()) {
      ev.preventDefault();
      document.getElementById("styles")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      alert("脚質を選んでください");
      return;
    }
    syncScoreInput();
    const flag = document.getElementById("ocr-ok");
    const slot = document.getElementById("shot-from-ocr");
    if (flag && flag.value === "1") {
      const has = (slot && slot.files && slot.files[0]) || ocrShot;
      if (!has) {
        ev.preventDefault();
        say("読取した画像が登録に載っていません。もう一度読み取ってください。");
        return;
      }
      if (ocrShot && slot && !(slot.files && slot.files[0]) && typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(ocrShot);
        slot.files = dt.files;
      }
    }
  });
  document.getElementById("do-idle")?.addEventListener("click", () => {
    resetToIdle();
  });
  updateHint();
})();
</script>`;
}
