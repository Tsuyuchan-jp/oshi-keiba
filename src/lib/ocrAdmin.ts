import { escapeHtml } from "./http";
import { STYLE_OPTIONS, type HorseScoreInput } from "./horseScoreInput";
import { catalogJsonForPage, classifySkillName } from "./skillCatalog";
import type { EventScoreSetup } from "./scoreSetup";
import { ALLOWED_SHOT_MIME } from "./shotMime";
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
  if (kind === "gold" || kind === "unique" || kind === "evo") return "gold";
  if (kind === "minus") return "minus";
  return "white";
}

/** 読取材料のチップ。掛かりスタミナ2欄は出さない */
export function registerMaterialsHtml(input: HorseScoreInput): string {
  const st = input.stats;
  const ap = input.aptitudes;
  const skills = input.skillNames
    .map((n) => {
      const c = classifySkillName(n);
      return `<span class="reg-chip ${skillChipClass(c.kind)}">${escapeHtml(c.name)}</span>`;
    })
    .join("");
  return `<div class="reg-stats">
      <div class="reg-stat"><span class="k">速</span><span class="v">${st.speed}</span></div>
      <div class="reg-stat"><span class="k">スタ</span><span class="v">${st.stamina}</span></div>
      <div class="reg-stat"><span class="k">パ</span><span class="v">${st.power}</span></div>
      <div class="reg-stat"><span class="k">根</span><span class="v">${st.guts}</span></div>
      <div class="reg-stat"><span class="k">賢</span><span class="v">${st.wisdom}</span></div>
    </div>
    <div class="reg-chips">
      ${aptChip("芝", ap.turf)}${aptChip("ダ", ap.dirt)}
      <span class="reg-slash" aria-hidden="true">/</span>
      ${aptChip("短", ap.short)}${aptChip("マイル", ap.mile)}${aptChip("中", ap.medium)}${aptChip("長", ap.long)}
      <span class="reg-slash" aria-hidden="true">/</span>
      ${aptChip("逃げ", ap.nige)}${aptChip("先行", ap.senkou)}${aptChip("差し", ap.sashi)}${aptChip("追込", ap.oikomi)}
    </div>
    <div class="reg-chips">${skills || `<span class="reg-chip">スキルなし</span>`}</div>`;
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
        <input type="file" name="shot" id="shot-from-ocr" class="admin-offscreen" accept="${SHOT_ACCEPT}" tabindex="-1">
        <input id="ocr-file" class="admin-offscreen" type="file" accept="${SHOT_ACCEPT}" tabindex="-1">
        <select name="style_key" id="style-key" class="admin-offscreen" tabindex="-1">${styleOpts}</select>
        <p class="odds-meta" id="ocr-status"></p>
        <div id="mode-idle">
          <div class="reg-drop" id="ocr-drop" role="button" tabindex="0">
            <strong>完成スクショを置く</strong>
            <p>クリックで選ぶか、ここにドロップ。PNG / JPEG / WebP。</p>
          </div>
          <p class="reg-alt"><button type="button" id="to-manual">スクショなしで直置きする</button></p>
          <div class="ctas" style="margin-top:.7rem">
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
              <div class="reg-preview" id="score-preview-wrap">
                <span class="lab">登録時に算出する評価点（OCR は材料だけ）</span>
                <span class="num" id="score-preview">—</span>
              </div>
              <div id="manual-block">
                <div class="reg-score-in" style="margin-top:.85rem;max-width:10rem">
                  <label>評価点（直置き）<input name="strength" id="strength" type="number" min="0" step="0.1" value="10"></label>
                </div>
                <label class="kind-opt" style="margin-top:.55rem">
                  <input type="checkbox" name="strength_manual" id="strength-manual" value="1"> 評価点を直置き
                </label>
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
export function ocrAdminScript(canAutoScore: boolean): string {
  const catalog = catalogJsonForPage();
  return `<script>
(function () {
  const KEY_LS = ${JSON.stringify(KEY_LS)};
  const CATALOG = ${catalog};
  const CAN_AUTO = ${canAutoScore ? "true" : "false"};
  const FUZZY_TH = 0.45;
  const KIND_JA = { green: "緑", gold: "金", white: "白", unique: "固有", evo: "進化", minus: "デバフ", inherit: "継承", special: "特殊", rare: "金", normal: "白", unknown: "未分類" };
  const ALIAS = { "千銀万錬": "千鍛万錬", "千段万錬": "千鍛万錬" };
  const STYLE_LABEL = { runner: "逃", leader: "先", betweener: "差", chaser: "追" };
  const skills = (CATALOG.skills || []).filter((s) => typeof s.id === "number");
  const names = skills.map((s) => s.name);
  const byName = new Map();
  for (const s of skills) {
    const list = byName.get(s.name) || [];
    list.push(s);
    byName.set(s.name, list);
  }
  function toHalf(str) {
    let s = str.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    return s.replace(/〇/g, "○");
  }
  function norm(s) { return toHalf(String(s || "").replace(/[\\s\\u3000]+/g, "")); }
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
  function fuzzyOne(raw, isFirst) {
    let clean = norm(raw);
    if (!clean) return null;
    clean = ALIAS[clean] || clean;
    let best = null;
    let bestR = -1;
    const ratings = [];
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
    if (!best || bestR < FUZZY_TH) return { input: raw, name: best || "", id: null, kind: "unknown", rating: bestR < 0 ? 0 : bestR, ok: false };
    const matched = byName.get(best) || [];
    let pick = matched[0];
    if (!pick) return { input: raw, name: best, id: null, kind: "unknown", rating: bestR, ok: false };
    if (matched.length > 1) {
      pick = isFirst ? (matched.find((s) => s.kind === "unique") || matched[0]) : (matched.find((s) => s.kind !== "unique") || matched[0]);
    } else if (!isFirst && pick.kind === "unique") {
      return { input: raw, name: best, id: null, kind: "unknown", rating: bestR, ok: false };
    }
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

  const keyInput = document.getElementById("gemini-key");
  const statusEl = document.getElementById("ocr-status");
  const scoreInputEl = document.getElementById("score-input");
  const styleEl = document.getElementById("style-key");
  const strengthEl = document.getElementById("strength");
  const manualEl = document.getElementById("strength-manual");
  const formEl = document.getElementById("horse-add");
  const fileEl = document.getElementById("ocr-file");
  function say(msg) {
    if (statusEl) statusEl.textContent = msg;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function chipKind(kind) {
    if (kind === "green") return "green";
    if (kind === "gold" || kind === "unique" || kind === "evo" || kind === "rare") return "gold";
    if (kind === "minus") return "minus";
    return "white";
  }
  function aptChip(lab, rank) {
    const r = String(rank || "—");
    const s = r.toUpperCase() === "S" ? " s" : "";
    return '<span class="reg-chip' + s + '">' + esc(lab) + " " + esc(r) + "</span>";
  }
  function pickGeminiKey(raw) {
    const s = String(raw || "").trim();
    const m = s.match(/AIza[0-9A-Za-z_-]+/);
    return m ? m[0] : s;
  }
  if (keyInput) keyInput.value = pickGeminiKey(localStorage.getItem(KEY_LS) || "");
  document.getElementById("gemini-save")?.addEventListener("click", () => {
    const v = pickGeminiKey(keyInput?.value);
    localStorage.setItem(KEY_LS, v);
    if (keyInput) keyInput.value = v;
    say("キーをこのブラウザに保存しました。");
  });
  document.getElementById("gemini-clear")?.addEventListener("click", () => {
    localStorage.removeItem(KEY_LS);
    if (keyInput) keyInput.value = "";
    say("キーを消しました。");
  });
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
    const skills = lastHits.filter((h) => h.ok).map((h) =>
      '<span class="reg-chip ' + chipKind(h.kind) + '">' + esc(h.name) + "</span>"
    ).join("");
    const miss = lastHits.filter((h) => !h.ok).map((h) =>
      '<span class="reg-chip minus" title="未採用">' + esc(h.input) + "</span>"
    ).join("");
    el.innerHTML =
      '<div class="reg-stats">' +
        '<div class="reg-stat"><span class="k">速</span><span class="v">' + esc(st.speed) + "</span></div>" +
        '<div class="reg-stat"><span class="k">スタ</span><span class="v">' + esc(st.stamina) + "</span></div>" +
        '<div class="reg-stat"><span class="k">パ</span><span class="v">' + esc(st.power) + "</span></div>" +
        '<div class="reg-stat"><span class="k">根</span><span class="v">' + esc(st.guts) + "</span></div>" +
        '<div class="reg-stat"><span class="k">賢</span><span class="v">' + esc(st.wisdom) + "</span></div>" +
      "</div>" +
      '<div class="reg-chips">' +
        aptChip("芝", ap.turf) + aptChip("ダ", ap.dirt) +
        '<span class="reg-slash" aria-hidden="true">/</span>' +
        aptChip("短", ap.short) + aptChip("マイル", ap.mile) + aptChip("中", ap.medium) + aptChip("長", ap.long) +
        '<span class="reg-slash" aria-hidden="true">/</span>' +
        aptChip("逃げ", ap.nige) + aptChip("先行", ap.senkou) + aptChip("差し", ap.sashi) + aptChip("追込", ap.oikomi) +
      "</div>" +
      '<div class="reg-chips">' + (skills || '<span class="reg-chip">スキルなし</span>') + miss + "</div>";
  }
  function showShotPreview(file) {
    const img = document.getElementById("reg-shot-img");
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = file ? URL.createObjectURL(file) : null;
    if (img) img.src = shotUrl || "";
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
    showShotPreview(null);
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
      styleKey: style || null,
    };
    scoreInputEl.value = JSON.stringify(payload);
    updateHint();
  }
  function updateHint() {
    const prev = document.getElementById("score-preview");
    const wrap = document.getElementById("score-preview-wrap");
    const manual = !!(manualEl && manualEl.checked);
    const hasDraft = !!draft;
    const style = styleEl?.value;
    const autoReady = CAN_AUTO && hasDraft && !!style && !manual;
    if (wrap) wrap.hidden = !hasDraft || manual;
    if (prev) prev.textContent = autoReady ? "自動" : "—";
    formEl?.classList.toggle("need-score", !!(formEl && (formEl.dataset.mode === "manual" || (formEl.dataset.mode === "read" && (!CAN_AUTO || manual)))));
    if (strengthEl) {
      const need = formEl && (formEl.dataset.mode === "manual" || (formEl.dataset.mode === "read" && (!CAN_AUTO || manual)));
      strengthEl.required = !!need;
    }
  }
  styleEl?.addEventListener("change", syncScoreInput);
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
      const instruction = "あなたはウマ娘の詳細ステータス画面を読む。JSONだけ返す。nameはウマ娘名（二つ名・ランクなし）。statsはspeed stamina power guts wisdomの整数。aptitudesはturf dirt short mile medium long nige senkou sashi oikomiのS〜G。skillsは取得スキル名を最後まで。緑も金もデバフ（右回り×等）も落とさない。";
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
      const umaEl = document.getElementById("uma-name");
      if (umaEl && uma) umaEl.value = uma;
      const rawSkills = Array.isArray(raw.skills) ? raw.skills.map(String) : [];
      const hits = rawSkills.map((s, i) => fuzzyOne(s, i === 0));
      const skillNames = [];
      const skillIds = [];
      for (const h of hits) {
        if (!h.ok) continue;
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
      };
      const sole = soleStyle(aptitudes);
      if (styleEl) styleEl.value = sole;
      paintStyleBtns();
      lastHits = hits;
      attachOcrShot(file);
      showShotPreview(file);
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
