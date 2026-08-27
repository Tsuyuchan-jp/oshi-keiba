/**
 * メンバー画面共通: ⋯メニューと使い方モーダルのスクリプト。
 * HTML／CSS は各 layout のまま。ログアウト有無はマークアップ側。
 */
import { appVersionLabel } from "./version.ts";

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
