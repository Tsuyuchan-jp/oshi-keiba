import { escapeHtml } from "./http";
import { horseSheetParts } from "./horseName";
import { STYLE_OPTIONS } from "./horseScoreInput";
import { catalogJsonForPage } from "./skillCatalog";
import type { EventScoreSetup } from "./scoreSetup";
import { ALLOWED_SHOT_MIME } from "./shotMime";
import type { Board } from "./store";

const KEY_LS = "oshi-keiba-gemini-key";
const SHOT_ACCEPT = ALLOWED_SHOT_MIME.join(",");

export function horsesAdminBody(
  board: Board,
  canSetup: boolean,
  scoreSetup: EventScoreSetup | null,
  opts?: { embedded?: boolean },
): string {
  const rows = board.horses
    .map((h) => {
      const p = horseSheetParts(h.horse);
      const shot = h.horse.shot_key ? "あり" : "なし";
      const hasMat = h.horse.score_input ? "材料あり" : "—";
      return `<tr>
        <td>${h.number}</td>
        <td>${escapeHtml(p.umaName)}</td>
        <td>${escapeHtml(p.runnerName)}</td>
        <td>${h.horse.strength}</td>
        <td>${hasMat}</td>
        <td>${shot}</td>
      </tr>`;
    })
    .join("");
  const setupNote = scoreSetup
    ? `<p class="note">開催条件あり。脚質と OCR 材料が揃えば評価点を自動算出します。直置きチェック時だけ手入力が正になります。</p>`
    : `<p class="note">開催条件（ステ目標）が未設定です。いまは評価点直置きのみ。開催設定で「開催条件とステ目標値」を入れてください。</p>`;
  const styleOpts = [
    `<option value="">未選択</option>`,
    ...STYLE_OPTIONS.map(
      (o) => `<option value="${o.key}">${escapeHtml(o.label)}</option>`,
    ),
  ].join("");
  const setup = canSetup
    ? `<section class="ocr-box">
        <h3>Gemini API キー</h3>
        <p class="note">このブラウザにだけ残します。サーバには送りません。Google AI Studio で発行してください。無料枠のまま、課金アカウントは付けないでください。他人と共有しないでください。</p>
        <div class="row">
          <label>キー <input id="gemini-key" type="password" autocomplete="off"></label>
          <button type="button" id="gemini-save">このブラウザに保存</button>
          <button type="button" class="secondary" id="gemini-clear">消す</button>
        </div>
        <h3>スクショから読む</h3>
        <p class="note">アプリ外で結合した完成画像を1枚（PNG / JPEG / WebP）。読取に成功した画像が、登録と同時に保存されます。評価点そのものは OCR では埋めません（材料だけ）。読まなくても下の直置きで登録できます（その場合スクショは残りません）。</p>
        ${setupNote}
        <div class="row">
          <label>画像 <input id="ocr-file" type="file" accept="${SHOT_ACCEPT}"></label>
          <button type="button" id="ocr-run">読み取る</button>
          <button type="button" class="secondary" id="ocr-stop">停止</button>
        </div>
        <pre class="ocr-out" id="ocr-out"></pre>
      </section>
      <form id="horse-add" method="post" action="/admin/horse" enctype="multipart/form-data" class="row" style="margin-top:1rem;flex-wrap:wrap">
        <input type="hidden" name="ocr_ok" id="ocr-ok" value="">
        <input type="hidden" name="score_input" id="score-input" value="">
        <input type="file" name="shot" id="shot-from-ocr" accept="${SHOT_ACCEPT}" hidden>
        <label>ウマ娘名 <input name="uma_name" id="uma-name" required maxlength="40"></label>
        <label>出走者 <input name="runner_name" id="runner-name" required maxlength="40"></label>
        <label>出走脚質 <select name="style_key" id="style-key">${styleOpts}</select></label>
        <label>評価点 <input name="strength" id="strength" type="number" min="0" step="0.1" value="10" required></label>
        <label><input type="checkbox" name="strength_manual" id="strength-manual" value="1"> 評価点を直置き</label>
        <button type="submit">登録</button>
      </form>
      <p class="note" id="score-hint">脚質適性に S が1つだけなら脚質を初期選択します。開催条件があり脚質と材料が揃うと、登録時に算出値を評価点に載せます。</p>`
    : `<p class="note">出走登録完了。飛び入り禁止。</p>`;
  const back = opts?.embedded ? "" : `<p class="note"><a href="/admin">進行へ戻る</a></p>`;
  return `${back}
    ${setup}
    ${opts?.embedded ? "" : `<table style="margin-top:1rem">
      <thead><tr><th>#</th><th>ウマ娘名</th><th>出走者</th><th>評価点</th><th>材料</th><th>スクショ</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6">まだいません</td></tr>`}</tbody>
    </table>`}`;
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
  const out = document.getElementById("ocr-out");
  const scoreInputEl = document.getElementById("score-input");
  const styleEl = document.getElementById("style-key");
  const strengthEl = document.getElementById("strength");
  const manualEl = document.getElementById("strength-manual");
  const hint = document.getElementById("score-hint");
  if (keyInput) keyInput.value = localStorage.getItem(KEY_LS) || "";
  document.getElementById("gemini-save")?.addEventListener("click", () => {
    localStorage.setItem(KEY_LS, keyInput.value.trim());
    if (out) out.textContent = "キーをこのブラウザに保存しました。";
  });
  document.getElementById("gemini-clear")?.addEventListener("click", () => {
    localStorage.removeItem(KEY_LS);
    if (keyInput) keyInput.value = "";
    if (out) out.textContent = "キーを消しました。";
  });

  let ac = null;
  let ocrShot = null;
  /** @type {any} */
  let draft = null;

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
    if (!hint) return;
    const manual = !!(manualEl && manualEl.checked);
    const hasDraft = !!draft;
    const style = styleEl?.value;
    if (manual) {
      hint.textContent = "直置きモード。評価点の手入力が Seed に使われます。";
      return;
    }
    if (!CAN_AUTO) {
      hint.textContent = "開催条件未設定のため評価点は直置きです。";
      return;
    }
    if (hasDraft && style) {
      hint.textContent = "登録時に評価点を自動算出します（手入力欄はバックアップ）。";
    } else if (hasDraft) {
      hint.textContent = "出走脚質を選ぶと自動算出できます。";
    } else {
      hint.textContent = "OCR なしの直置き、または読み取り後に脚質を選んで登録。";
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
  document.getElementById("ocr-run")?.addEventListener("click", async () => {
    const file = document.getElementById("ocr-file")?.files?.[0];
    const apiKey = (keyInput?.value || localStorage.getItem(KEY_LS) || "").trim();
    if (!apiKey) { out.textContent = "キーを入れてください。"; return; }
    if (!file) { out.textContent = "画像を選んでください。"; return; }
    const mime = resolveShotMime(file);
    if (!mime) { out.textContent = "対応形式は PNG / JPEG / WebP です。"; return; }
    out.textContent = "読み取り中…";
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
      const lines = [];
      lines.push("ウマ娘名\\t" + uma);
      lines.push("スピード\\t" + draft.stats.speed);
      lines.push("スタミナ\\t" + draft.stats.stamina);
      lines.push("パワー\\t" + draft.stats.power);
      lines.push("根性\\t" + draft.stats.guts);
      lines.push("賢さ\\t" + draft.stats.wisdom);
      lines.push("適正\\t芝" + aptitudes.turf + " ダ" + aptitudes.dirt + " 短" + aptitudes.short + " マ" + aptitudes.mile + " 中" + aptitudes.medium + " 長" + aptitudes.long);
      lines.push("脚質適性\\t逃" + aptitudes.nige + " 先" + aptitudes.senkou + " 差" + aptitudes.sashi + " 追" + aptitudes.oikomi);
      lines.push("脚質初期\\t" + (sole ? (STYLE_LABEL[sole] || sole) : "未選択（人手）"));
      lines.push("スキル照合 " + skillNames.length + "/" + rawSkills.length + "（デバフ含む・ファジー）");
      for (const h of hits) {
        const ja = KIND_JA[h.kind] || "未分類";
        if (h.ok) lines.push(ja + "\\t" + h.name + "\\tid " + h.id + "\\t" + h.rating.toFixed(2));
        else lines.push("未採用\\t" + h.input + (h.name ? " → " + h.name : "") + "\\t" + h.rating.toFixed(2));
      }
      attachOcrShot(file);
      syncScoreInput();
      out.textContent = lines.join("\\n");
    } catch (err) {
      if (err && err.name === "AbortError") out.textContent = "停止しました。";
      else out.textContent = err instanceof Error ? err.message : String(err);
    }
  });
  document.getElementById("horse-add")?.addEventListener("submit", (ev) => {
    syncScoreInput();
    const flag = document.getElementById("ocr-ok");
    const slot = document.getElementById("shot-from-ocr");
    if (flag && flag.value === "1") {
      const has = (slot && slot.files && slot.files[0]) || ocrShot;
      if (!has) {
        ev.preventDefault();
        if (out) out.textContent = "読取した画像が登録に載っていません。もう一度読み取ってください。";
        return;
      }
      if (ocrShot && slot && !(slot.files && slot.files[0]) && typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(ocrShot);
        slot.files = dt.files;
      }
    }
  });
  updateHint();
})();
</script>`;
}
