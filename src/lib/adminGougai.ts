import { adminPageHero } from "./adminUi.ts";
import { escapeHtml } from "./http.ts";
import {
  gougaiOverlays,
  overlayColumns,
  overlayLabel,
} from "./gougaiOverlay.ts";
import { gougaiPaperHtml } from "./gougaiPaper.ts";
import { gougaiSubtitleFiles, gougaiSubtitleUrl } from "./gougaiSubtitles.ts";
import { GOUGAI_DEFAULT_MASTHEAD, gougaiView } from "./gougaiView.ts";
import type { Board } from "./storeTypes.ts";

function overlayOptions(umaName: string, selected: string): string {
  return gougaiOverlays()
    .map((row) => {
      const on = row.slogan === selected ? " selected" : "";
      return `<option value="${escapeHtml(row.slogan)}"${on}>${escapeHtml(overlayLabel(row, umaName))}</option>`;
    })
    .join("");
}

function subtitlePicker(selected: string): string {
  return gougaiSubtitleFiles()
    .map((file) => {
      const on = file === selected ? " on" : "";
      return `<button type="button" class="gougai-sub${on}" data-file="${escapeHtml(file)}" title="${escapeHtml(file)}"><img src="${escapeHtml(gougaiSubtitleUrl(file))}" alt="" loading="lazy" decoding="async"></button>`;
    })
    .join("");
}

function overlayJson(umaName: string): string {
  const rows = gougaiOverlays().map((row) => ({
    slogan: row.slogan,
    ...overlayColumns(row, umaName),
  }));
  return JSON.stringify(rows).replace(/</g, "\\u003c");
}

function exportScript(umaName: string): string {
  return `<script>
function gougaiStandFallback(el) {
  if (el.dataset.standFallback) {
    const next = el.dataset.standFallback;
    delete el.dataset.standFallback;
    el.src = next;
    return;
  }
  if (el.dataset.petit) {
    const next = el.dataset.petit;
    delete el.dataset.petit;
    el.src = next;
    return;
  }
  const ph = document.createElement("div");
  ph.className = "cover-stand cover-stand-ph";
  ph.textContent = el.dataset.ph || "・";
  el.replaceWith(ph);
}
</script>
<script type="module">
import { domToBlob } from "/vendor/modern-screenshot.mjs";

const KEYS = {
  masthead: "oshi-keiba:gougai:masthead",
  slogan: "oshi-keiba:gougai:slogan",
  subtitle: "oshi-keiba:gougai:subtitle",
};
const overlays = ${overlayJson(umaName)};
const paper = document.getElementById("gougai-paper");
const mastInput = document.getElementById("gougai-masthead");
const overlaySel = document.getElementById("gougai-overlay");
const bodyEdit = document.getElementById("gougai-body");
const article = paper?.querySelector(".article .inner");
const masthead = paper?.querySelector(".masthead");
const midCol = paper?.querySelector('[data-col="mid"]');
const leftCol = paper?.querySelector('[data-col="left"]');
const subImg = paper?.querySelector(".sub-img-wrap img");
const cover = paper?.querySelector(".cover");
const photo = document.getElementById("gougai-photo");
const photoInput = document.getElementById("gougai-photo-input");
const photoEditor = document.getElementById("gougai-photo-editor");
const photoEditorImage = document.getElementById("gougai-photo-editor-image");
const photoZoom = document.getElementById("gougai-photo-zoom");
const photoReset = document.getElementById("gougai-photo-reset");
const photoControls = document.getElementById("gougai-photo-controls");
let photoUrl = "";
let photoState = null;

function setMsg(text, isError) {
  const el = document.getElementById("gougai-export-msg");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", Boolean(isError));
}
function stored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (_) {
    return fallback;
  }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* 端末に残らなくても紙面は更新する */ }
}
function applyOverlay(slogan) {
  const row = overlays.find((item) => item.slogan === slogan) || overlays[0];
  if (!row || !midCol || !leftCol) return;
  midCol.textContent = row.mid;
  leftCol.textContent = row.left;
}
function applySubtitle(file) {
  if (!subImg) return;
  subImg.src = "/twinkle/subtitles/" + file;
  subImg.dataset.file = file;
  document.querySelectorAll(".gougai-sub").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.file === file);
  });
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function imageLayout(stage) {
  if (!photoState || !stage) return null;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  if (!width || !height) return null;
  const base = Math.max(width / photoState.width, height / photoState.height);
  const imageWidth = photoState.width * base * photoState.zoom;
  const imageHeight = photoState.height * base * photoState.zoom;
  const left = clamp(width / 2 - photoState.focusX * imageWidth, width - imageWidth, 0);
  const top = clamp(height / 2 - photoState.focusY * imageHeight, height - imageHeight, 0);
  return { width, height, imageWidth, imageHeight, left, top };
}
function renderPhotoImage(image, stage) {
  const layout = imageLayout(stage);
  if (!image || !layout) return;
  image.style.width = layout.imageWidth + "px";
  image.style.height = layout.imageHeight + "px";
  image.style.left = layout.left + "px";
  image.style.top = layout.top + "px";
}
function renderPhoto() {
  renderPhotoImage(photo, photo?.parentElement);
  renderPhotoImage(photoEditorImage, photoEditor);
}
function clearPhoto() {
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = "";
  photoState = null;
  if (photo) photo.removeAttribute("src");
  if (photoEditorImage) photoEditorImage.removeAttribute("src");
  if (photoInput) photoInput.value = "";
  cover?.classList.remove("has-custom-photo");
  photoControls?.setAttribute("hidden", "");
  photoReset?.setAttribute("disabled", "");
}
function applyPhoto(file) {
  if (!file || !file.type.startsWith("image/")) {
    setMsg("画像ファイルを選んでください", true);
    return;
  }
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  const nextPhotoUrl = URL.createObjectURL(file);
  photoUrl = nextPhotoUrl;
  const probe = new Image();
  probe.onload = () => {
    if (photoUrl !== nextPhotoUrl) return;
    photoState = { width: probe.naturalWidth, height: probe.naturalHeight, zoom: 1, focusX: .5, focusY: .5 };
    if (photo) photo.src = nextPhotoUrl;
    if (photoEditorImage) photoEditorImage.src = nextPhotoUrl;
    cover?.classList.add("has-custom-photo");
    photoControls?.removeAttribute("hidden");
    photoReset?.removeAttribute("disabled");
    if (photoZoom) photoZoom.value = "1";
    requestAnimationFrame(renderPhoto);
    setMsg("メインビュー画像を反映しました", false);
  };
  probe.onerror = () => {
    if (photoUrl !== nextPhotoUrl) return;
    clearPhoto();
    setMsg("この画像は読み込めません", true);
  };
  probe.src = nextPhotoUrl;
}
function movePhoto(dx, dy) {
  const layout = imageLayout(photoEditor);
  if (!photoState || !layout) return;
  const left = clamp(layout.left + dx, layout.width - layout.imageWidth, 0);
  const top = clamp(layout.top + dy, layout.height - layout.imageHeight, 0);
  photoState.focusX = clamp((layout.width / 2 - left) / layout.imageWidth, 0, 1);
  photoState.focusY = clamp((layout.height / 2 - top) / layout.imageHeight, 0, 1);
  renderPhoto();
}
function sanitizeBody(html) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const okColor = (value) => {
    const n = value.replace(/\\s/g, "").toLowerCase();
    return n === "#ff9900" || n === "rgb(255,153,0)";
  };
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE || child.nodeName === "BR") return;
      if (child.nodeName === "SPAN") {
        const lead = child.classList?.contains("lead") || okColor(child.style?.color || "");
        walk(child);
        child.removeAttribute("style");
        if (lead) child.className = "lead";
        else child.replaceWith(...child.childNodes);
        return;
      }
      walk(child);
      child.replaceWith(...child.childNodes);
    });
  };
  walk(wrap);
  return wrap.innerHTML;
}
function syncBody() {
  if (!bodyEdit || !article) return;
  article.innerHTML = sanitizeBody(bodyEdit.innerHTML);
}
function paint(orange) {
  bodyEdit?.focus();
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand("foreColor", false, orange ? "#ff9900" : "#1a1a1a");
  syncBody();
}
async function waitFonts() {
  try { if (document.fonts?.ready) await document.fonts.ready; } catch (_) { /* システムフォントのまま */ }
}
async function waitImages(root) {
  await Promise.all([...root.querySelectorAll("img")].map((img) => {
    if (typeof img.decode === "function") return img.decode().catch(() => {});
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  }));
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
async function exportPaper(type, ext) {
  const btnPng = document.getElementById("gougai-png");
  const btnWebp = document.getElementById("gougai-webp");
  if (!paper) {
    setMsg("紙面がありません", true);
    return;
  }
  const base = paper.dataset.fileBase || "号外";
  btnPng?.setAttribute("disabled", "");
  btnWebp?.setAttribute("disabled", "");
  setMsg("書き出し中…", false);
  try {
    await waitFonts();
    await waitImages(paper);
    const blob = await domToBlob(paper, {
      type,
      scale: 2,
      quality: type === "image/webp" ? 0.92 : 1,
      width: Math.ceil(paper.offsetWidth),
      height: Math.ceil(paper.offsetHeight),
    });
    if (!blob) throw new Error("empty");
    downloadBlob(blob, base + "." + ext);
    setMsg(ext.toUpperCase() + " を保存しました", false);
  } catch (err) {
    setMsg(type === "image/webp" ? "このブラウザでは WebP を書き出せません" : "書き出しに失敗しました", true);
    console.error(err);
  } finally {
    btnPng?.removeAttribute("disabled");
    btnWebp?.removeAttribute("disabled");
  }
}

const savedMast = stored(KEYS.masthead, ${JSON.stringify(GOUGAI_DEFAULT_MASTHEAD)});
if (mastInput) mastInput.value = savedMast;
if (masthead) masthead.textContent = savedMast;
const savedSlogan = stored(KEYS.slogan, overlaySel?.value || "");
if (savedSlogan && overlaySel) {
  overlaySel.value = savedSlogan;
  applyOverlay(savedSlogan);
}
const savedSub = stored(KEYS.subtitle, subImg?.dataset.file || "");
if (savedSub) applySubtitle(savedSub);

mastInput?.addEventListener("input", () => {
  const value = mastInput.value.trim() || ${JSON.stringify(GOUGAI_DEFAULT_MASTHEAD)};
  if (masthead) masthead.textContent = value;
  store(KEYS.masthead, value);
});
overlaySel?.addEventListener("change", () => {
  applyOverlay(overlaySel.value);
  store(KEYS.slogan, overlaySel.value);
});
document.getElementById("gougai-subs")?.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".gougai-sub");
  if (!btn?.dataset.file) return;
  applySubtitle(btn.dataset.file);
  store(KEYS.subtitle, btn.dataset.file);
});
photoInput?.addEventListener("change", () => applyPhoto(photoInput.files?.[0]));
photoZoom?.addEventListener("input", () => {
  if (!photoState) return;
  photoState.zoom = Number(photoZoom.value) || 1;
  renderPhoto();
});
photoReset?.addEventListener("click", clearPhoto);
let photoPointer = null;
photoEditor?.addEventListener("pointerdown", (ev) => {
  if (!photoState) return;
  photoPointer = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
  photoEditor.setPointerCapture(ev.pointerId);
  photoEditor.classList.add("is-dragging");
});
photoEditor?.addEventListener("pointermove", (ev) => {
  if (!photoPointer || photoPointer.id !== ev.pointerId) return;
  movePhoto(ev.clientX - photoPointer.x, ev.clientY - photoPointer.y);
  photoPointer.x = ev.clientX;
  photoPointer.y = ev.clientY;
});
function endPhotoDrag(ev) {
  if (!photoPointer || photoPointer.id !== ev.pointerId) return;
  photoPointer = null;
  photoEditor?.classList.remove("is-dragging");
}
photoEditor?.addEventListener("pointerup", endPhotoDrag);
photoEditor?.addEventListener("pointercancel", endPhotoDrag);
if (photoEditor && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(renderPhoto).observe(photoEditor);
}
bodyEdit?.addEventListener("input", syncBody);
bodyEdit?.addEventListener("paste", (ev) => {
  ev.preventDefault();
  const text = ev.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
});
document.getElementById("gougai-color-orange")?.addEventListener("click", () => paint(true));
document.getElementById("gougai-color-ink")?.addEventListener("click", () => paint(false));
document.getElementById("gougai-png")?.addEventListener("click", () => exportPaper("image/png", "png"));
document.getElementById("gougai-webp")?.addEventListener("click", () => exportPaper("image/webp", "webp"));
</script>`;
}

export function adminGougaiPage(board: Board): { body: string; scripts: string } {
  const sheet = gougaiView(board);
  const actions = `<button type="button" class="admin-action admin-action--secondary" id="gougai-png">PNG</button><button type="button" class="admin-action admin-action--secondary" id="gougai-webp">WebP</button>`;
  const banner = sheet.hasWinner
    ? ""
    : `<p class="gougai-banner" role="status">1着未入力。紙面はプレースホルダです。</p>`;
  const hero = adminPageHero("号外", board.event.status, {
    meta: `<span class="page-hero-meta">${sheet.hasWinner ? "1着あり" : "1着未入力"}</span>`,
    actions,
  });
  const body = `${hero}${banner}
    <p class="note" id="gougai-export-msg" role="status"></p>
    <div class="gougai-desk">
      <section class="work">
        <h2>プレビュー</h2>
        <div class="gougai-sheet">${gougaiPaperHtml(sheet)}</div>
      </section>
      <section class="work">
        <h2>編集</h2>
        <label class="gougai-field">誌名
          <input id="gougai-masthead" type="text" value="${escapeHtml(sheet.masthead)}" autocomplete="off">
        </label>
        <label class="gougai-field">縦書き
          <select id="gougai-overlay">${overlayOptions(sheet.umaName, sheet.overlaySlogan)}</select>
        </label>
        <div class="gougai-field">
          <span>右列画像</span>
          <div class="gougai-subs" id="gougai-subs">${subtitlePicker(sheet.subtitleFile)}</div>
        </div>
        <div class="gougai-field">
          <span>メインビュー画像</span>
          <div class="gougai-photo-actions">
            <label class="admin-action admin-action--secondary gougai-photo-select">画像を選ぶ
              <input id="gougai-photo-input" type="file" accept="image/png,image/jpeg,image/webp">
            </label>
            <button type="button" class="admin-action admin-action--secondary" id="gougai-photo-reset" disabled>テンプレートに戻す</button>
          </div>
          <div class="gougai-photo-controls" id="gougai-photo-controls" hidden>
            <div class="gougai-photo-editor" id="gougai-photo-editor"><img id="gougai-photo-editor-image" alt=""></div>
            <label>拡大・縮小
              <input id="gougai-photo-zoom" type="range" min="1" max="3" value="1" step="0.01">
            </label>
            <p class="gougai-photo-note">画像をドラッグして切り抜き位置を調整できます。</p>
          </div>
        </div>
        <div class="gougai-field">
          <span>本文</span>
          <div class="gougai-color-row">
            <button type="button" class="admin-action admin-action--secondary" id="gougai-color-orange">オレンジ</button>
            <button type="button" class="admin-action admin-action--secondary" id="gougai-color-ink">黒に戻す</button>
          </div>
          <div class="gougai-body" id="gougai-body" contenteditable="true" spellcheck="false">${sheet.bodyHtml}</div>
        </div>
      </section>
    </div>`;
  return { body, scripts: exportScript(sheet.umaName) };
}
