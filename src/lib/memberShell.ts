/**
 * メンバー画面共通: ⋯メニューと使い方モーダルのスクリプト。
 * HTML／CSS は各 layout のまま。ログアウト有無はマークアップ側。
 */
import { appVersionLabel } from "./version.ts";

/** 場内・窓口で同じ時刻帯のマークアップにする */
export function chromeTimesHtml(metaNow: string, metaClose: string): string {
  return `<div class="chrome-times">${metaNow}${metaClose}</div>`;
}

/** 場内系ページ共通の背景設定モーダル */
export function backgroundModal(): string {
  return `<dialog class="member-modal" id="background-modal">
    <h2>背景</h2>
    <p class="background-current" id="background-current"></p>
    <div class="background-options">
      <label class="background-option"><strong><input type="radio" name="background" value="auto"> 自動</strong><span>時間に合わせて切り替える</span></label>
      <label class="background-option"><strong><input type="radio" name="background" value="day"> 昼に固定</strong><span>レース映像に合わせた明るい背景</span></label>
      <label class="background-option"><strong><input type="radio" name="background" value="night"> 夜に固定</strong><span>ナイターの雰囲気の背景</span></label>
    </div>
    <form method="dialog"><button type="submit">閉じる</button></form>
  </dialog>`;
}

/** PC 枠外右下。バージョンは管理者リンクの直上 */
export function memberOutLinks(): string {
  return `<nav class="out-links" aria-label="その他">
    <a href="#" id="howto-out">使い方</a>
    <span class="out-admin">
      <span class="app-ver">${appVersionLabel()}</span>
      <a href="/admin">管理者</a>
    </span>
  </nav>`;
}

export function memberMoreScript(): string {
  return `<script>
(() => {
  const moreBtn = document.getElementById("more-btn");
  const morePop = document.getElementById("more-pop");
  const howto = document.getElementById("howto-modal");
  const background = document.getElementById("background-modal");
  const backgroundOpen = document.getElementById("background-open");
  const preferenceKey = "oshi-keiba:background";
  if (moreBtn && morePop) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const on = morePop.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", on ? "true" : "false");
    });
    document.addEventListener("click", () => {
      morePop.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    });
    morePop.addEventListener("click", (e) => e.stopPropagation());
  }
  const openHowto = (ev) => {
    ev.preventDefault();
    if (howto && howto.showModal) howto.showModal();
    if (morePop && moreBtn) {
      morePop.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    }
  };
  document.getElementById("howto-open")?.addEventListener("click", openHowto);
  const backgroundSlot = () => {
    const hour = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo", hour: "numeric", hour12: false,
    }).formatToParts(new Date()).find((part) => part.type === "hour")?.value ?? 0);
    if (hour >= 6 && hour < 16) return "day";
    if (hour >= 16 && hour < 19) return "dusk";
    return "night";
  };
  const backgroundLabel = (slot) => ({ day: "昼", dusk: "夕方", night: "夜" })[slot] ?? "夜";
  const syncBackground = () => {
    const preference = globalThis.localStorage?.getItem(preferenceKey);
    const value = preference === "day" || preference === "night" ? preference : "auto";
    const input = background?.querySelector("input[value=\"" + value + "\"]");
    if (input) input.checked = true;
    const current = document.getElementById("background-current");
    if (current) current.textContent = value === "auto" ? "現在：" + backgroundLabel(backgroundSlot()) : "選択した背景を表示します";
  };
  backgroundOpen?.addEventListener("click", () => {
    syncBackground();
    background?.showModal();
    morePop?.classList.remove("open");
    moreBtn?.setAttribute("aria-expanded", "false");
  });
  background?.querySelectorAll("input[name=background]").forEach((input) => {
    input.addEventListener("change", () => {
      const value = input.value;
      if (value === "auto") globalThis.localStorage?.removeItem(preferenceKey);
      else globalThis.localStorage?.setItem(preferenceKey, value);
      const scene = document.querySelector(".scene");
      if (scene) scene.dataset.slot = value === "auto" ? backgroundSlot() : value;
      syncBackground();
    });
  });
  document.getElementById("howto-out")?.addEventListener("click", openHowto);
  if (howto) {
    howto.addEventListener("click", (ev) => {
      const r = howto.getBoundingClientRect();
      const inside =
        ev.clientX >= r.left && ev.clientX <= r.right &&
        ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) howto.close();
    });
  }
})();
</script>`;
}
