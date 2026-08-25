import assert from "node:assert/strict";
import { test } from "node:test";
import {
  diceCoefficient,
  fuzzyMatchSkill,
  resolveOcrSkills,
} from "./skillFuzzy.ts";

test("Dice: 同一は1", () => {
  assert.equal(diceCoefficient("千鍛万錬", "千鍛万錬"), 1);
});

test("OCRエイリアス: 千銀万錬 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千銀万錬", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("ためらい id", () => {
  const h = fuzzyMatchSkill("逃げためらい", false);
  assert.equal(h.accepted, true);
  assert.equal(h.id, 200851);
});

test("resolveOcrSkills は採用分だけ並べる", () => {
  const { skillNames, skillIds } = resolveOcrSkills([
    "先頭の景色は譲らない…！",
    "千銀万錬",
    "@@@",
  ]);
  assert.ok(skillNames.includes("千鍛万錬"));
  assert.equal(skillNames.length, skillIds.length);
  assert.ok(!skillNames.includes("@@@"));
});
