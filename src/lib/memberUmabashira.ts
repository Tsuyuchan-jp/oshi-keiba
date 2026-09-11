import { umabashiraPaperHtml } from "./umabashiraPaper.ts";
import { umabashiraView } from "./umabashiraView.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";
import type { Board } from "./storeTypes.ts";

export function memberUmabashiraModalHtml(
  board: Board,
  strategicSkills: readonly StrategicSkillRow[] = [],
): string {
  const paper = umabashiraPaperHtml(umabashiraView(board, strategicSkills));
  return `<dialog class="umabashira-modal" id="umabashira-modal" aria-labelledby="umabashira-modal-title">
    <header class="umabashira-modal-head">
      <div>
        <h2 id="umabashira-modal-title">ウマ柱</h2>
        <p>スマホは2本指、PCはホイールで拡大・縮小。拡大後はドラッグで移動できます。</p>
      </div>
      <div class="umabashira-modal-tools" aria-label="表示倍率">
        <button type="button" id="umabashira-zoom-out" aria-label="縮小">−</button>
        <button type="button" id="umabashira-zoom-reset">全体</button>
        <button type="button" id="umabashira-zoom-in" aria-label="拡大">＋</button>
        <button type="button" class="umabashira-modal-close" id="umabashira-close">閉じる</button>
      </div>
    </header>
    <div class="umabashira-viewport" id="umabashira-viewport">
      <div class="umabashira-canvas" id="umabashira-canvas">${paper}</div>
    </div>
  </dialog>`;
}

export function memberUmabashiraScript(): string {
  return `<script>
(() => {
  const open = document.getElementById("umabashira-open");
  const modal = document.getElementById("umabashira-modal");
  const close = document.getElementById("umabashira-close");
  const viewport = document.getElementById("umabashira-viewport");
  const canvas = document.getElementById("umabashira-canvas");
  if (!open || !modal || !viewport || !canvas) return;

  const pointers = new Map();
  let scale = 1;
  let minScale = 1;
  let x = 0;
  let y = 0;
  let dragStart = null;
  let pinchStart = null;

  function limits(nextX, nextY, nextScale = scale) {
    const paper = canvas.firstElementChild;
    if (!paper) return { x: 0, y: 0 };
    const width = paper.offsetWidth * nextScale;
    const height = paper.offsetHeight * nextScale;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const axis = (next, viewportSize, contentSize) => {
      if (contentSize <= viewportSize) return desktop ? (viewportSize - contentSize) / 2 : 0;
      return Math.min(0, Math.max(viewportSize - contentSize, next));
    };
    return {
      x: axis(nextX, viewport.clientWidth, width),
      y: axis(nextY, viewport.clientHeight, height),
    };
  }
  function render() {
    const p = limits(x, y);
    x = p.x;
    y = p.y;
    const paper = canvas.firstElementChild;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    if (desktop && paper && "zoom" in paper.style) {
      // PC は transform で引き伸ばさず、文字を倍率ごとに描き直して鮮明に保つ。
      paper.style.zoom = String(scale);
      canvas.style.transform = "translate(" + x + "px," + y + "px)";
    } else {
      if (paper) paper.style.zoom = "";
      canvas.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
    }
  }
  function resetView() {
    const paper = canvas.firstElementChild;
    if (!paper) return;
    minScale = Math.min(1, viewport.clientWidth / paper.offsetWidth);
    scale = minScale;
    x = 0;
    y = 0;
    render();
  }
  function localPoint(e) {
    const rect = viewport.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  function beginPinch() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return;
    const mid = midpoint(pts[0], pts[1]);
    pinchStart = {
      distance: Math.max(1, distance(pts[0], pts[1])),
      scale,
      worldX: (mid.x - x) / scale,
      worldY: (mid.y - y) / scale,
    };
    dragStart = null;
  }
  function zoomTo(nextScale, cx, cy) {
    const clamped = Math.min(Math.max(minScale, nextScale), Math.max(3, minScale));
    const worldX = (cx - x) / scale;
    const worldY = (cy - y) / scale;
    scale = clamped;
    x = cx - worldX * scale;
    y = cy - worldY * scale;
    render();
  }

  open.addEventListener("click", () => {
    modal.showModal();
    requestAnimationFrame(resetView);
  });
  close?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
  document.getElementById("umabashira-zoom-reset")?.addEventListener("click", resetView);
  document.getElementById("umabashira-zoom-in")?.addEventListener("click", () => zoomTo(scale * 1.25, viewport.clientWidth / 2, viewport.clientHeight / 2));
  document.getElementById("umabashira-zoom-out")?.addEventListener("click", () => zoomTo(scale / 1.25, viewport.clientWidth / 2, viewport.clientHeight / 2));
  viewport.addEventListener("wheel", (e) => {
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    e.preventDefault();
    const point = localPoint(e);
    zoomTo(scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), point.x, point.y);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    const point = localPoint(e);
    pointers.set(e.pointerId, point);
    viewport.setPointerCapture(e.pointerId);
    if (pointers.size === 1) dragStart = { point, x, y };
    if (pointers.size === 2) beginPinch();
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, localPoint(e));
    if (pointers.size >= 2 && pinchStart) {
      const pts = [...pointers.values()];
      const mid = midpoint(pts[0], pts[1]);
      scale = Math.min(Math.max(minScale, pinchStart.scale * distance(pts[0], pts[1]) / pinchStart.distance), Math.max(3, minScale));
      x = mid.x - pinchStart.worldX * scale;
      y = mid.y - pinchStart.worldY * scale;
      render();
    } else if (pointers.size === 1 && dragStart && scale > minScale + 0.001) {
      const point = pointers.values().next().value;
      x = dragStart.x + point.x - dragStart.point.x;
      y = dragStart.y + point.y - dragStart.point.y;
      render();
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    pinchStart = null;
    const remaining = pointers.values().next().value;
    dragStart = remaining ? { point: remaining, x, y } : null;
  }
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
  modal.addEventListener("close", () => {
    pointers.clear();
    dragStart = null;
    pinchStart = null;
  });
  window.addEventListener("resize", () => { if (modal.open) resetView(); });
})();
</script>`;
}
