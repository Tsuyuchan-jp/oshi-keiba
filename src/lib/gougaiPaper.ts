import { escapeHtml } from "./http.ts";
import type { GougaiSheet } from "./gougaiView.ts";

function standHtml(sheet: GougaiSheet): string {
  const ph = escapeHtml(sheet.umaName.slice(0, 1) || "・");
  const petit = sheet.petitUrl ? escapeHtml(sheet.petitUrl) : "";
  const fallback = sheet.standFallbackUrl ? escapeHtml(sheet.standFallbackUrl) : "";
  const src = sheet.standUrl || sheet.petitUrl;
  if (!src) return `<div class="cover-stand cover-stand-ph">${ph}</div>`;
  const extraFallback = fallback && fallback !== escapeHtml(src) ? ` data-stand-fallback="${fallback}"` : "";
  const extraPetit = petit && sheet.standUrl ? ` data-petit="${petit}"` : "";
  return `<img class="cover-stand" src="${escapeHtml(src)}" alt="${escapeHtml(sheet.umaName)}" data-ph="${ph}"${extraFallback}${extraPetit} onerror="gougaiStandFallback(this)">`;
}

function iconHtml(sheet: GougaiSheet): string {
  if (!sheet.trainerIconUrl) return `<span class="icon icon-ph">未登録</span>`;
  return `<img class="icon" src="${escapeHtml(sheet.trainerIconUrl)}" alt="">`;
}

/** モック `.paper` と同じ紙面。書き出し対象はルート要素。 */
export function gougaiPaperHtml(sheet: GougaiSheet): string {
  return `<article class="gougai-paper" id="gougai-paper" data-file-base="${escapeHtml(sheet.fileBase)}" data-has-winner="${sheet.hasWinner ? "1" : "0"}">
      <header class="masthead">${escapeHtml(sheet.masthead)}</header>
      <div class="cover">
        <div class="cover-photo" aria-hidden="true"><img id="gougai-photo" alt=""></div>
        <img class="cover-bg" src="/twinkle/frames/gogai_bg.png" alt="">
        ${standHtml(sheet)}
        <div class="cover-blue" aria-hidden="true"></div>
        <div class="cover-titles">
          <div class="sub-img-wrap">
            <img src="${escapeHtml(sheet.subtitleUrl)}" alt="" data-file="${escapeHtml(sheet.subtitleFile)}">
          </div>
          <span class="col-text" data-col="mid">${escapeHtml(sheet.overlayMid)}</span>
          <span class="col-text" data-col="left">${escapeHtml(sheet.overlayLeft)}</span>
        </div>
      </div>
      <div class="article">
        <p class="inner">${sheet.bodyHtml}</p>
      </div>
      <section class="trainer" aria-label="優勝者と開催条件">
        <img class="trainer-sparkles" src="/twinkle/frames/gogai_sparkles.png" alt="">
        <div class="who-row">
          <div class="face">
            <img class="wreath" src="/twinkle/frames/gogai_wreath.png" alt="">
            ${iconHtml(sheet)}
          </div>
          <div class="who-copy">
            <span class="win">優勝</span>
            <p class="who">${escapeHtml(sheet.runnerName)}</p>
            <p class="uma">${escapeHtml(sheet.umaName)}</p>
          </div>
          <ul class="facts">
            <li class="event">${escapeHtml(sheet.eventTitle)}</li>
            <li class="course">${escapeHtml(sheet.facts.course)}</li>
            <li class="cond">${escapeHtml(sheet.facts.cond)}</li>
          </ul>
        </div>
      </section>
    </article>`;
}
