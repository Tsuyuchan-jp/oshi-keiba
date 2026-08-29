import assert from "node:assert/strict";
import { test } from "node:test";
import { paddockGroupLayout } from "./paddockLayout.ts";

test("パドック配置は指定人数ぶん返す", () => {
  for (const count of [0, 1, 3, 6, 9, 12, 18]) assert.equal(paddockGroupLayout(count).length, count);
});

test("代表人数は調整済みテンプレートを使う", () => {
  assert.deepEqual(paddockGroupLayout(3)[0], { x: 32, y: 68, scale: 1 });
  assert.deepEqual(paddockGroupLayout(6)[5], { x: 49, y: 11.2, scale: 0.955 });
  const positions = paddockGroupLayout(9);
  assert.deepEqual(positions[0], { x: 20.5, y: 68, scale: 1 });
  assert.deepEqual(positions[8], { x: 57, y: 16.2, scale: 0.91 });
  assert.deepEqual(paddockGroupLayout(12)[11], { x: 70.4, y: 16.4, scale: 0.9 });
});

test("人数が多いほど奥側の層が増える", () => {
  const positions = paddockGroupLayout(12);
  assert.ok(Math.min(...positions.map((position) => position.y)) < 20);
  assert.ok(Math.max(...positions.map((position) => position.y)) > 60);
});
