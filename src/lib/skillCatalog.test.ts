import assert from "node:assert/strict";
import { test } from "node:test";
import { classifySkill, classifySkillName } from "./skillCatalog.ts";

test("classifySkillName: 同名は unique 優先", () => {
  const c = classifySkillName("先頭の景色は譲らない…！");
  assert.equal(c.kind, "unique");
  assert.equal(c.id, 100021);
});

test("classifySkill: id があれば inherit / unique を分ける", () => {
  const name = "先頭の景色は譲らない…！";
  assert.equal(classifySkill(name, 100021).kind, "unique");
  assert.equal(classifySkill(name, 900021).kind, "inherit");
  assert.equal(classifySkill(name, null).kind, "unique");
});
