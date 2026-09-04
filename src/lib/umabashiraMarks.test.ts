import assert from "node:assert/strict";
import { test } from "node:test";
import { MARK_NONE, marksForHorses } from "./umabashiraMarks.ts";

test("印は評価点順。同点はウマ番小が上。7位以下は無印", () => {
  const marks = marksForHorses([
    { number: 1, strength: 10 },
    { number: 2, strength: 30 },
    { number: 3, strength: 20 },
    { number: 4, strength: 20 },
    { number: 5, strength: 5 },
    { number: 6, strength: 4 },
    { number: 7, strength: 3 },
  ]);
  assert.deepEqual(marks, ["△", "◎", "○", "▲", "△", "△", MARK_NONE]);
});

test("2頭立ては本命と対抗だけ", () => {
  assert.deepEqual(marksForHorses([
    { number: 1, strength: 1 },
    { number: 2, strength: 2 },
  ]), ["○", "◎"]);
});

test("評価点が欠けた頭は無印で末尾", () => {
  const marks = marksForHorses([
    { number: 1, strength: null },
    { number: 2, strength: 8 },
    { number: 3, strength: 9 },
  ]);
  assert.deepEqual(marks, [MARK_NONE, "○", "◎"]);
});
