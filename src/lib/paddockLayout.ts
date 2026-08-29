export type PaddockPosition = {
  x: number;
  y: number;
  scale: number;
};

const HAND_TUNED_TEMPLATES: Readonly<Record<number, readonly [number, number][]>> = {
  3: [[32, 68], [30.8, 10.8], [48, 41.2]],
  6: [[29.3, 68], [50.7, 68], [38.1, 40.3], [58.5, 41.2], [28.5, 11.2], [49, 11.2]],
  9: [[20.5, 68], [38.9, 68], [57.3, 68], [29.8, 41.9], [47.8, 41.8], [65.9, 41.8], [21.6, 16], [39, 16.2], [57, 16.2]],
  12: [[16.5, 68], [34.6, 68], [52.8, 68], [70.7, 69.5], [43.8, 41.9], [7.2, 41.8], [62.2, 43], [26.1, 43.4], [34.3, 16.4], [17.1, 16.9], [53.1, 16.6], [70.4, 16.4]],
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
