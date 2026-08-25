import assert from "node:assert/strict";
import { test } from "node:test";
import { evalGreenClause, evalGreenCondition } from "./greenCondition.ts";
import { greenSkillById, greenSkillByName, sumGreenBonusesByNames } from "./greenSkills.ts";

test("右回り○はスピード+40", () => {
  const g = greenSkillByName("右回り○");
  assert.ok(g);
  assert.equal(g.id, 200012);
  assert.equal(g.speed, 40);
  assert.equal(g.condition, "rotation==1");
  assert.equal(greenSkillById(200012)?.name, "右回り○");
});

test("右回り×はスピード-40", () => {
  assert.equal(greenSkillByName("右回り×")?.speed, -40);
});

test("逃げのコツ○は賢さ+40", () => {
  assert.equal(greenSkillByName("逃げのコツ○")?.wisdom, 40);
});

test("ためらい等の非緑はマスタに無い", () => {
  assert.equal(greenSkillByName("逃げためらい"), undefined);
});

test("AND/OR: 道悪はバ場状態 2〜4", () => {
  const cond = "ground_condition==2@ground_condition==3@ground_condition==4";
  assert.equal(evalGreenCondition(cond, { groundCondition: 1 }), false);
  assert.equal(evalGreenCondition(cond, { groundCondition: 3 }), true);
});

test("複合: 泥遊びはダートかつ道悪", () => {
  const cond = "ground_type==2&ground_condition==3@ground_type==2&ground_condition==4";
  assert.equal(evalGreenCondition(cond, { groundType: 2, groundCondition: 3 }), true);
  assert.equal(evalGreenCondition(cond, { groundType: 1, groundCondition: 3 }), false);
  assert.equal(evalGreenCondition(cond, { groundType: 2, groundCondition: 1 }), false);
});

test("always は常に成立", () => {
  assert.equal(evalGreenClause("always==1", {}), true);
});

test("文脈に無いキーは不成立", () => {
  assert.equal(evalGreenClause("rotation==1", {}), false);
  assert.equal(evalGreenClause("popularity>=4", {}), false);
});

test("条件を満たす緑だけ足す", () => {
  const names = ["右回り○", "左回り○", "逃げのコツ○", "地固め"];
  const right = sumGreenBonusesByNames(names, { rotation: 1, runningStyle: 1 });
  assert.equal(right.speed, 40);
  assert.equal(right.wisdom, 40);

  const left = sumGreenBonusesByNames(names, { rotation: 2, runningStyle: 2 });
  assert.equal(left.speed, 40);
  assert.equal(left.wisdom, 0);
});

test("脚質が違うとコツは乗らない", () => {
  const s = sumGreenBonusesByNames(["逃げのコツ○"], { runningStyle: 3 });
  assert.equal(s.wisdom, 0);
});
