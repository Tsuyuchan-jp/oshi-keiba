export type PaddockPosition = {
  x: number;
  y: number;
  scale: number;
};

const HAND_TUNED_TEMPLATES: Readonly<Record<number, readonly [number, number][]>> = {
  3: [[32.4, 11], [31.6, 68], [47.7, 39.9]],
  6: [[32.6, 41.9], [24.4, 64.2], [46.5, 68], [22.4, 15], [44.3, 14.5], [55.2, 44.7]],
  9: [[20.3, 68], [39.1, 68], [57.6, 64.2], [28.2, 41.8], [46.4, 42.2], [65.5, 42.4], [20.3, 16.7], [39.7, 16.7], [58, 16.9]],
  12: [[14.6, 68], [33, 68], [51, 68], [4.2, 41.6], [41.9, 37.9], [68.1, 69.4], [34, 14.7], [24.4, 43.1], [60.1, 43.1], [16.2, 14.8], [51.3, 15.1], [68.6, 15.1]],
};

function scaleFor(index: number): number {
  return Math.max(0.9, 1 - Math.floor(index / 3) * 0.045);
}

function layerSizes(count: number): number[] {
  const layers = Math.ceil(count / 3);
  const base = Math.floor(count / layers);
  return Array.from({ length: layers }, (_, index) => base + (index < count % layers ? 1 : 0));
}

function layerY(layer: number, layers: number): number {
  if (layers === 1) return 48;
  return 67 - (56 * layer) / (layers - 1);
}

function rowX(size: number, column: number, layer: number): number {
  const patterns = size === 1 ? [42] : size === 2 ? [12, 54] : [4, 34, 64];
  const sway = [0, 3.5, -2.5, 2, -3][layer % 5];
  return patterns[column] + sway;
}

/**
 * 脚質エリア内の百分率座標を返す。手前ほど y が大きく、奥ほど少し小さくする。
 * 代表人数はユーザー調整済みの基準配置をそのまま利用する。
 */
export function paddockGroupLayout(count: number): PaddockPosition[] {
  if (!Number.isInteger(count) || count < 0) throw new Error("count must be a non-negative integer");
  const handTuned = HAND_TUNED_TEMPLATES[count];
  if (handTuned) return handTuned.map(([x, y], index) => ({ x, y, scale: scaleFor(index) }));
  const sizes = layerSizes(count);
  const positions: PaddockPosition[] = [];
  sizes.forEach((size, layer) => {
    for (let column = 0; column < size; column += 1) {
      positions.push({
        x: rowX(size, column, layer),
        y: layerY(layer, sizes.length) + ((column % 2 === 0 ? 1 : -1) * 1.8),
        scale: scaleFor(positions.length),
      });
    }
  });
  return positions;
}
