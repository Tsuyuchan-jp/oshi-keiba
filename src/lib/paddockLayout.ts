export type PaddockPosition = {
  x: number;
  y: number;
  scale: number;
};

const NINE_RUNNER_REFERENCE: readonly PaddockPosition[] = [
  { x: 9.2, y: 68, scale: 1 },
  { x: 34.9, y: 66.4, scale: 1 },
  { x: 60.1, y: 68, scale: 1 },
  { x: 14.2, y: 42.7, scale: 0.97 },
  { x: 43.9, y: 41.5, scale: 0.97 },
  { x: 71, y: 42.2, scale: 0.97 },
  { x: 0.2, y: 11.4, scale: 0.94 },
  { x: 27.3, y: 14.2, scale: 0.94 },
  { x: 52.4, y: 13.3, scale: 0.94 },
];

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
 * 9人時はユーザー調整済みの基準配置をそのまま利用する。
 */
export function paddockGroupLayout(count: number): PaddockPosition[] {
  if (!Number.isInteger(count) || count < 0) throw new Error("count must be a non-negative integer");
  if (count === 9) return NINE_RUNNER_REFERENCE.map((position) => ({ ...position }));
  const sizes = layerSizes(count);
  const positions: PaddockPosition[] = [];
  sizes.forEach((size, layer) => {
    for (let column = 0; column < size; column += 1) {
      positions.push({
        x: rowX(size, column, layer),
        y: layerY(layer, sizes.length) + ((column % 2 === 0 ? 1 : -1) * 1.8),
        scale: Math.max(0.9, 1 - layer * 0.03),
      });
    }
  });
  return positions;
}
