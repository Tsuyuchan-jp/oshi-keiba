import { adminPageHero } from "./adminUi.ts";
import { umabashiraPaperHtml } from "./umabashiraPaper.ts";
import { umabashiraView } from "./umabashiraView.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";
import type { Board } from "./storeTypes.ts";

function exportScript(): string {
  return `<script type="module">
import { domToBlob } from "/vendor/modern-screenshot.mjs";

function fitWidth(el, minPx) {
  el.style.fontSize = "";
  let px = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth + 0.5 && px > minPx) {
    px -= 0.4;
    el.style.fontSize = px + "px";
  }
}
function fitRunners(root) {
  root.querySelectorAll(".board .col:not(.stub-col) .runner span").forEach((el) => fitWidth(el, 7.5));
  root.querySelectorAll(".board .stub-col .runner").forEach((el) => fitWidth(el, 7));
}
function setMsg(text, isError) {
  const el = document.getElementById("umabashira-export-msg");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", Boolean(isError));
}
async function waitFonts() {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch (_) { /* システムフォントのまま書き出す */ }
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
  const paper = document.getElementById("umabashira-paper");
  const btnPng = document.getElementById("umabashira-png");
  const btnWebp = document.getElementById("umabashira-webp");
  if (!paper) {
    setMsg("紙面がありません", true);
    return;
  }
  const base = paper.dataset.fileBase || "ウマ柱";
  fitRunners(paper);
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
    });
    if (!blob) throw new Error("empty");
    downloadBlob(blob, base + "." + ext);
    setMsg(ext.toUpperCase() + " を保存しました", false);
  } catch (err) {
    const webpFail = type === "image/webp";
    setMsg(webpFail ? "このブラウザでは WebP を書き出せません" : "書き出しに失敗しました", true);
    console.error(err);
  } finally {
    btnPng?.removeAttribute("disabled");
    btnWebp?.removeAttribute("disabled");
  }
}

const paper = document.getElementById("umabashira-paper");
if (paper) fitRunners(paper);
document.getElementById("umabashira-png")?.addEventListener("click", () => exportPaper("image/png", "png"));
document.getElementById("umabashira-webp")?.addEventListener("click", () => exportPaper("image/webp", "webp"));
</script>`;
}

export function adminUmabashiraPage(
  board: Board,
  strategicSkills: readonly StrategicSkillRow[] = [],
): { body: string; scripts: string } {
  const sheet = umabashiraView(board, strategicSkills);
  const actions = `<button type="button" class="admin-action admin-action--secondary" id="umabashira-png">PNG</button><button type="button" class="admin-action admin-action--secondary" id="umabashira-webp">WebP</button>`;
  const hero = adminPageHero("ウマ柱", board.event.status, {
    meta: `<span class="page-hero-meta">${sheet.horses.length}頭</span>`,
    actions,
  });
  const body = `${hero}
    <p class="note" id="umabashira-export-msg" role="status"></p>
    <div class="umabashira-desk">
      <section class="work">
        <h2>プレビュー</h2>
        <div class="umabashira-sheet">${umabashiraPaperHtml(sheet)}</div>
      </section>
      <section class="work">
        <h2>編集</h2>
        <p class="note">第1段は自動差し込みです。紙面の手入力は後からこの欄へ足します。</p>
      </section>
    </div>`;
  return { body, scripts: exportScript() };
}
