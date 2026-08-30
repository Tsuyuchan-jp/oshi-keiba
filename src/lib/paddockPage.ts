import { escapeHtml } from "./http.ts";
import type { PaddockView } from "./paddockView.ts";

const STYLE_ORDER = ["chaser", "betweener", "leader", "runner"] as const;

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function paddockPage(view: PaddockView): string {
  const styleCounts = STYLE_ORDER.map((style) => ({
    style,
    count: view.horses.filter((horse) => horse.style === style).length,
  }));
  const countText = styleCounts
    .map(({ style, count }) => `${styleLabel(style)} ${count}`)
    .join("　｜　");
  const raceText = view.race
    ? `${view.race.courseName}　${view.race.distance}m　${view.race.surface}　${view.race.season}　${view.race.weather}　${view.race.groundCondition}`
    : "レース条件未設定";
  return `<!doctype html>
<html lang="ja"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(view.title)}｜出走ウマ娘紹介</title>
  <link rel="stylesheet" href="/paddock.css">
  <link rel="stylesheet" href="/paddock-mobile.css" media="(max-width: 700px)">
</head><body class="paddock-page">
<main class="paddock-stage">
  <section class="race-view" aria-label="出走ウマ娘一覧">
    <header class="scoreboard">
      <div class="scoreboard__top"><b>PADDOCK</b><span>${escapeHtml(raceText)}</span></div>
      <h1>${escapeHtml(view.title)}　出走ウマ娘紹介</h1>
      <p>${escapeHtml(countText)}</p>
    </header>
    <div id="horse-groups" class="horse-groups"></div>
    <p class="stage-note">ウマ娘を選ぶと、右の選手紹介カードに詳細を表示します</p>
  </section>
  <aside id="detail" class="detail" aria-live="polite"></aside>
</main>
<script>window.__PADDOCK__=${jsonForScript(view)};</script><script src="/paddock.js"></script>
</body></html>`;
}

function styleLabel(style: (typeof STYLE_ORDER)[number]): string {
  return ({ chaser: "追込", betweener: "差し", leader: "先行", runner: "逃げ" })[style];
}
