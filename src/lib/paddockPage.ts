import { escapeHtml } from "./http.ts";
import type { PaddockView } from "./paddockView.ts";
import { howToModal } from "./ui.ts";

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
      <div class="scoreboard__top">
        <b>PADDOCK</b>
        <span class="scoreboard__race">${escapeHtml(raceText)}</span>
        <div class="scoreboard__actions">
          <nav class="paddock-site-nav" aria-label="ページ移動">
            <a href="/">場内</a>
            <a href="/bet">窓口</a>
            <a class="on" href="/paddock">パドック</a>
          </nav>
          <button type="button" class="paddock-more-btn" id="paddock-more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button>
          <div class="paddock-more-pop" id="paddock-more-pop">
            <a href="/tickets">馬券</a>
            <a href="#" id="paddock-howto-open">使い方</a>
            <a href="/logout">ログアウト</a>
            <a href="/admin">管理者</a>
          </div>
        </div>
      </div>
      <h1>${escapeHtml(view.title)}</h1>
      <p>${escapeHtml(countText)}</p>
    </header>
    <nav class="paddock-nav" aria-label="パドックの移動">
      <a href="/">← 場内へ</a>
      <a class="paddock-nav__bet" href="/bet">窓口へ →</a>
    </nav>
    <div id="horse-groups" class="horse-groups"></div>
    <p class="stage-note">ウマ娘を選ぶと、右の選手紹介カードに詳細を表示します</p>
  </section>
  <aside id="detail" class="detail" aria-live="polite"></aside>
</main>
<script>window.__PADDOCK__=${jsonForScript(view)};</script><script src="/paddock.js"></script>
${howToModal()}
<script>
(() => {
  const button = document.getElementById("paddock-more-btn");
  const popup = document.getElementById("paddock-more-pop");
  const howto = document.getElementById("howto-modal");
  if (button && popup) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = popup.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", () => {
      popup.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    });
    popup.addEventListener("click", (event) => event.stopPropagation());
  }
  document.getElementById("paddock-howto-open")?.addEventListener("click", (event) => {
    event.preventDefault();
    howto?.showModal();
    popup?.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  });
  howto?.addEventListener("click", (event) => {
    const rect = howto.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) howto.close();
  });
})();
</script>
</body></html>`;
}

function styleLabel(style: (typeof STYLE_ORDER)[number]): string {
  return ({ chaser: "追込", betweener: "差し", leader: "先行", runner: "逃げ" })[style];
}
