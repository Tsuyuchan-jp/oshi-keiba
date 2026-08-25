import assert from "node:assert/strict";
import { test } from "node:test";
import { evalGreenClause, evalGreenCondition } from "./greenCondition.ts";

test("比較演算子", () => {
  assert.equal(evalGreenClause("base_speed>=1200", { baseSpeed: 1200 }), true);
  assert.equal(evalGreenClause("base_speed>=1200", { baseSpeed: 1199 }), false);
  assert.equal(evalGreenClause("post_number<=3", { postNumber: 3 }), true);
  assert.equal(evalGreenClause("post_number>=6", { postNumber: 5 }), false);
});

test("is_exist_skill_id", () => {
  assert.equal(
    evalGreenClause("is_exist_skill_id==201631", { ownedSkillIds: new Set([201631]) }),
    true,
  );
  assert.equal(evalGreenClause("is_exist_skill_id==201631", { ownedSkillIds: new Set() }), false);
  assert.equal(evalGreenClause("is_exist_skill_id==201631", {}), false);
});

test("random_lot は常に不成立（手打ちに含めない）", () => {
  assert.equal(evalGreenClause("random_lot==50", {}), false);
});

test("空条件は成立", () => {
  assert.equal(evalGreenCondition("", {}), true);
});
