/** メンバー画面共通: JST の背景時間帯をブラウザ側で更新する。 */
export function memberSceneSlotScript(clockId?: string): string {
  const updateClock = clockId
    ? `
    const clock = document.getElementById(${JSON.stringify(clockId)});
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(new Date());
    }`
    : "";

  return `<script>
(() => {
  const scene = document.querySelector(".scene");
  const slot = new URLSearchParams(location.search).get("slot");
  function fromClock() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo", hour: "numeric", hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
    if (hour >= 6 && hour < 16) return "day";
    if (hour >= 16 && hour < 19) return "dusk";
    return "night";
  }
  function tick() {${updateClock}
    if (!scene) return;
    scene.dataset.slot = slot === "day" || slot === "dusk" || slot === "night"
      ? slot
      : fromClock();
  }
  tick();
  setInterval(tick, 10000);
})();
</script>`;
}
