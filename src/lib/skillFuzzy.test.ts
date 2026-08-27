import assert from "node:assert/strict";
import { test } from "node:test";
import {
  diceCoefficient,
  editDistance,
  fuzzyMatchSkill,
  resolveOcrSkills,
  applySenmanSkeleton,
  normalizeSkillLabel,
} from "./skillFuzzy.ts";

test("Dice: 同一は1", () => {
  assert.equal(diceCoefficient("千鍛万錬", "千鍛万錬"), 1);
});

test("編集距離: 一文字置換は1", () => {
  assert.equal(editDistance("千錬万錬", "千鍛万錬"), 1);
  assert.equal(editDistance("千鍛万錬", "千鍛万錬"), 0);
});

test("千.万.骨格: カタログに無い成語寄せ → 千鍛万錬", () => {
  assert.equal(applySenmanSkeleton("千紫万紅"), "千鍛万錬");
  assert.equal(applySenmanSkeleton("千客万来"), "千鍛万錬");
  assert.equal(applySenmanSkeleton("千何万某"), "千鍛万錬");
});

test("千.万.骨格: 正式名と非4文字は触らない", () => {
  assert.equal(applySenmanSkeleton("千鍛万錬"), "千鍛万錬");
  const bariki = normalizeSkillLabel("千万バリキ！！！");
  assert.equal(applySenmanSkeleton(bariki), bariki);
  assert.equal(applySenmanSkeleton("千辛万苦切り裂く刃"), "千辛万苦切り裂く刃");
});

test("OCR骨格経由: 未登録の千○万○ → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千藍万翠", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("OCRエイリアス: 千銀万錬 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千銀万錬", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("OCR一文字誤読: 千錬万錬 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千錬万錬", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.equal(h.id, 204031);
});

test("OCRエイリアス: 千鍬万鐘 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千鍬万鐘", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("OCRエイリアス: 千客万来 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千客万来", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("OCRエイリアス: 千紫万紅 → 千鍛万錬", () => {
  const h = fuzzyMatchSkill("千紫万紅", false);
  assert.equal(h.accepted, true);
  assert.equal(h.name, "千鍛万錬");
  assert.ok(h.id != null);
});

test("OCRエイリアス: 勝利へ至る累積 → 勝利ヘ至ル累積（2番目以降は inherit）", () => {
  const first = fuzzyMatchSkill("勝利へ至る累積", true);
  assert.equal(first.accepted, true);
  assert.equal(first.name, "勝利ヘ至ル累積");
  assert.equal(first.kind, "unique");
  assert.equal(first.id, 120231);

  const later = fuzzyMatchSkill("勝利へ至る累積", false);
  assert.equal(later.accepted, true);
  assert.equal(later.name, "勝利ヘ至ル累積");
  assert.equal(later.kind, "inherit");
  assert.equal(later.id, 920231);
});

test("ためらい id", () => {
  const h = fuzzyMatchSkill("逃げためらい", false);
  assert.equal(h.accepted, true);
  assert.equal(h.id, 200851);
});

test("黄金を訪ねて: 先頭は unique、以降は継承進化", () => {
  const first = fuzzyMatchSkill("黄金を訪ねて", true);
  assert.equal(first.accepted, true);
  assert.equal(first.kind, "unique");
  assert.equal(first.id, 101351);

  const later = fuzzyMatchSkill("黄金を訪ねて", false);
  assert.equal(later.accepted, true);
  assert.equal(later.kind, "special");
  assert.equal(later.id, 91101351);
});

test("ずっとずっと輝いて: 先頭は unique、以降は継承進化", () => {
  const first = fuzzyMatchSkill("ずっとずっと輝いて", true);
  assert.equal(first.accepted, true);
  assert.equal(first.kind, "unique");
  assert.equal(first.id, 111091);

  const later = fuzzyMatchSkill("ずっとずっと輝いて", false);
  assert.equal(later.accepted, true);
  assert.equal(later.kind, "special");
  assert.equal(later.id, 92111091);
});

test("先頭の景色は譲らない…！: 先頭以外は通常継承", () => {
  const first = fuzzyMatchSkill("先頭の景色は譲らない…！", true);
  assert.equal(first.accepted, true);
  assert.equal(first.kind, "unique");

  const later = fuzzyMatchSkill("先頭の景色は譲らない…！", false);
  assert.equal(later.accepted, true);
  assert.equal(later.kind, "inherit");
  assert.notEqual(later.id, first.id);
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
