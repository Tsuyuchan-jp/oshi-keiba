import { escapeHtml } from "./http.ts";
import { MARK_NONE } from "./umabashiraMarks.ts";
import type { UmabashiraHorseView, UmabashiraSheet } from "./umabashiraView.ts";

const STAT_LABELS = ["速", "スタ", "パ", "根", "賢"] as const;

function dashCell(extraClass: string): string {
  return `<div class="cell ${extraClass} empty">—</div>`;
}

function faceHtml(h: UmabashiraHorseView): string {
  const ch = escapeHtml(h.umaName.slice(0, 1) || "・");
  if (!h.petitUrl) return `<div class="ph">${ch}</div>`;
  return `<img src="${escapeHtml(h.petitUrl)}" alt="" data-ph="${ch}" onerror="this.outerHTML='<div class=ph>'+this.dataset.ph+'</div>'">`;
}

function statsHtml(h: UmabashiraHorseView): string {
  if (!h.stats) return dashCell("stats");
  return `<div class="cell stats">${h.stats
    .map((v, i) => `<span><span class="lab">${STAT_LABELS[i]}</span>${v}</span>`)
    .join("")}</div>`;
}

function aptHtml(h: UmabashiraHorseView): string {
  if (!h.apt) return dashCell("apt");
  return `<div class="cell apt">${h.apt
    .map((t) => (t.highlight ? `<span class="s">${escapeHtml(t.text)}</span>` : `<span>${escapeHtml(t.text)}</span>`))
    .join("")}</div>`;
}

function spHtml(h: UmabashiraHorseView): string {
  if (!h.sp) return dashCell("sp");
  return `<div class="cell sp"><b>${h.sp.base}</b><small>有効</small><small>白${h.sp.white}</small><small>金${h.sp.gold}</small></div>`;
}

function markHtml(mark: string): string {
  return mark === MARK_NONE
    ? `<span class="mk none" aria-label="無印">${MARK_NONE}</span>`
    : `<span class="mk">${escapeHtml(mark)}</span>`;
}

function oddsHtml(h: UmabashiraHorseView): string {
  const odds = h.odds == null ? MARK_NONE : h.odds.toFixed(1);
  return `<div class="cell odds-cell">${markHtml(h.mark)}<b>${odds}</b></div>`;
}

function strengthHtml(h: UmabashiraHorseView): string {
  const n = h.strength == null ? "—" : h.strength.toFixed(1);
  return `<div class="cell score-cell"><b>${n}</b></div>`;
}

function horseCol(h: UmabashiraHorseView): string {
  const style = h.styleLabel ? escapeHtml(h.styleLabel) : "—";
  return `<div class="col">
        <div class="cell id-row"><div class="num" style="width:100%"><b>${h.number}</b><span class="style">${style}</span></div></div>
        <div class="cell who">${faceHtml(h)}<span class="uma">${escapeHtml(h.umaName)}</span></div>
        <div class="cell runner"><span>${escapeHtml(h.runnerName)}</span></div>
        ${strengthHtml(h)}
        ${oddsHtml(h)}
        ${statsHtml(h)}${aptHtml(h)}${spHtml(h)}
      </div>`;
}

function stubCol(): string {
  const cls = ["id-row", "who", "runner", "score-cell", "odds-cell", "stats", "apt", "sp"];
  const rows = [
    { t: "番・脚", v: true },
    { t: "ウマ娘", v: true },
    { t: "トレーナー", v: false },
    { t: "評価点", v: false },
    { t: "印/オッズ", v: false, split: true },
    { t: "ステ", v: true },
    { t: "適性", v: true },
    { t: "SP", v: true },
  ];
  return `<div class="col stub-col">${rows
    .map((row, i) => {
      const mode = row.v ? "stub-v" : "stub-h";
      const extra = row.split ? " stub-split" : "";
      const inner = row.split
        ? row.t.split("/").map((p) => `<span>${escapeHtml(p)}</span>`).join("")
        : row.v
          ? `<span>${escapeHtml(row.t)}</span>`
          : escapeHtml(row.t);
      return `<div class="cell stub-cell ${cls[i]} ${mode}${extra}">${inner}</div>`;
    })
    .join("")}</div>`;
}

/** モック上段と同じ紙面。書き出し対象はルート要素。 */
export function umabashiraPaperHtml(sheet: UmabashiraSheet): string {
  const n = sheet.horses.length;
  const cols = sheet.horses.map(horseCol).join("");
  return `<div class="umabashira-paper" id="umabashira-paper" data-file-base="${escapeHtml(sheet.fileBase)}">
        <div class="mast">
          <span>${escapeHtml(sheet.title)}</span>
          <span class="meta">${escapeHtml(sheet.courseLine)}</span>
          <span class="keys">◎本命 ○対抗 ▲単穴 △穴　／　SP＝点数・有効・白・金</span>
        </div>
        <div class="board" style="--n:${n}">${stubCol()}${cols}</div>
      </div>`;
}
