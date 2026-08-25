import assert from "node:assert/strict";
import { test } from "node:test";
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

test("名前リストの上昇を足す", () => {
  const s = sumGreenBonusesByNames(["右回り○", "逃げのコツ○", "地固め"]);
  assert.equal(s.speed, 40);
  assert.equal(s.wisdom, 40);
});
