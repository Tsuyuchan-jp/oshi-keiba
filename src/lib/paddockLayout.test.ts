import assert from "node:assert/strict";
import { test } from "node:test";
import { paddockGroupLayout } from "./paddockLayout.ts";

test("パドック配置は指定人数ぶん返す", () => {
  for (const count of [0, 1, 3, 6, 9, 12, 18]) assert.equal(paddockGroupLayout(count).length, count);
});

test("9人時は調整済みの三層配置を使う", () => {
  const positions = paddockGroupLayout(9);
  assert.deepEqual(positions[0], { x: 9.2, y: 68, scale: 1 });
  assert.deepEqual(positions[8], { x: 52.4, y: 13.3, scale: 0.94 });
});

test("人数が多いほど奥側の層が増える", () => {
  const positions = paddockGroupLayout(12);
  assert.ok(Math.min(...positions.map((position) => position.y)) < 15);
  assert.ok(Math.max(...positions.map((position) => position.y)) > 60);
});
