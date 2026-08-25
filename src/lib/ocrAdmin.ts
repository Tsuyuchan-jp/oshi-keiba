import { escapeHtml } from "./http";
import { horseSheetParts } from "./horseName";
import { catalogJsonForPage } from "./skillCatalog";
import type { Board } from "./store";

const KEY_LS = "oshi-keiba-gemini-key";

export function horsesAdminBody(board: Board, canSetup: boolean): string {
  const rows = board.horses
    .map((h) => {
      const p = horseSheetParts(h.horse);
      const shot = h.horse.shot_key ? "あり" : "なし";
      return `<tr>
        <td>${h.number}</td>
        <td>${escapeHtml(p.umaName)}</td>
        <td>${escapeHtml(p.runnerName)}</td>
        <td>${h.horse.strength}</td>
        <td>${shot}</td>
      </tr>`;
    })
    .join("");
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
        <p class="note">アプリ外で結合した完成画像を1枚。読取に成功した画像が、登録と同時に保存されます。評価点は埋めません。読まなくても下の直置きで登録できます（その場合スクショは残りません）。</p>
        <div class="row">
          <label>画像 <input id="ocr-file" type="file" accept="image/png,image/jpeg"></label>
          <button type="button" id="ocr-run">読み取る</button>
          <button type="button" class="secondary" id="ocr-stop">停止</button>
        </div>
        <pre class="ocr-out" id="ocr-out"></pre>
      </section>
      <form id="horse-add" method="post" action="/admin/horse" enctype="multipart/form-data" class="row" style="margin-top:1rem">
        <input type="hidden" name="ocr_ok" id="ocr-ok" value="">
        <input type="file" name="shot" id="shot-from-ocr" accept="image/png,image/jpeg" hidden>
        <label>ウマ娘名 <input name="uma_name" id="uma-name" required maxlength="40"></label>
        <label>出走者 <input name="runner_name" id="runner-name" required maxlength="40"></label>
        <label>Strength <input name="strength" type="number" min="0" step="0.1" value="10" required></label>
        <button type="submit">登録</button>
      </form>`
    : `<p class="note">出走登録完了。飛び入り禁止。</p>`;
  return `<p class="note"><a href="/admin">管理トップへ戻る</a></p>
    ${setup}
    <table style="margin-top:1rem">
      <thead><tr><th>#</th><th>ウマ娘名</th><th>出走者</th><th>Strength</th><th>スクショ</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5">まだいません</td></tr>`}</tbody>
    </table>`;
}

export function ocrAdminScript(): string {
  const catalog = catalogJsonForPage();
  return `<script>
(function () {
  const KEY_LS = ${JSON.stringify(KEY_LS)};
  const CATALOG = ${catalog};
  const KIND_JA = { green: "緑", gold: "金", white: "白", unique: "固有", evo: "進化", minus: "デバフ", inherit: "継承", special: "特殊", rare: "金" };
  const byName = new Map((CATALOG.skills || []).map((s) => [s.name, s.kind]));
  const keyInput = document.getElementById("gemini-key");
  const out = document.getElementById("ocr-out");
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
  function classify(name) {
    const kind = byName.get(name) || "unknown";
    const ja = KIND_JA[kind] || "未分類";
    return ja + "\\t" + name;
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
  document.getElementById("ocr-run")?.addEventListener("click", async () => {
    const file = document.getElementById("ocr-file")?.files?.[0];
    const apiKey = (keyInput?.value || localStorage.getItem(KEY_LS) || "").trim();
    if (!apiKey) { out.textContent = "キーを入れてください。"; return; }
    if (!file) { out.textContent = "画像を選んでください。"; return; }
    out.textContent = "読み取り中…";
    ac = new AbortController();
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error("画像を読めませんでした"));
        r.readAsDataURL(file);
      });
      const b64 = String(dataUrl).replace(/^data:image\\/(png|jpeg);base64,/, "");
      const instruction = "あなたはウマ娘の詳細ステータス画面を読む。JSONだけ返す。nameはウマ娘名（二つ名・ランクなし）。statsはspeed stamina power guts wisdomの整数。aptitudesはturf dirt short mile medium long nige senkou sashi oikomiのS〜G。skillsは取得スキル名を最後まで。緑も金もデバフ（右回り×等）も落とさない。";
      const payload = {
        system_instruction: { parts: { text: instruction } },
        contents: [{ parts: [
          { text: "この画像のステータスをJSONで抽出してください。" },
          { inline_data: { mime_type: file.type || "image/png", data: b64 } }
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
      const skills = Array.isArray(raw.skills) ? raw.skills.map(String) : [];
      const st = raw.stats || {};
      const ap = raw.aptitudes || {};
      const lines = [];
      lines.push("ウマ娘名\\t" + uma);
      lines.push("スピード\\t" + (st.speed ?? ""));
      lines.push("スタミナ\\t" + (st.stamina ?? ""));
      lines.push("パワー\\t" + (st.power ?? ""));
      lines.push("根性\\t" + (st.guts ?? ""));
      lines.push("賢さ\\t" + (st.wisdom ?? ""));
      lines.push("適正\\t芝" + (ap.turf ?? "") + " ダ" + (ap.dirt ?? "") + " 短" + (ap.short ?? "") + " マ" + (ap.mile ?? "") + " 中" + (ap.medium ?? "") + " 長" + (ap.long ?? ""));
      lines.push("脚質\\t逃" + (ap.nige ?? "") + " 先" + (ap.senkou ?? "") + " 差" + (ap.sashi ?? "") + " 追" + (ap.oikomi ?? ""));
      lines.push("スキル " + skills.length + "件（デバフ含む）");
      for (const s of skills) lines.push(classify(s));
      attachOcrShot(file);
      out.textContent = lines.join("\\n");
    } catch (err) {
      if (err && err.name === "AbortError") out.textContent = "停止しました。";
      else out.textContent = err instanceof Error ? err.message : String(err);
    }
  });
  document.getElementById("horse-add")?.addEventListener("submit", (ev) => {
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
})();
</script>`;
}
