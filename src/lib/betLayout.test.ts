import assert from "node:assert/strict";
import { test } from "node:test";
import { betKindSlots } from "./betBoard.ts";

test("単勝は1枠・連勝は枠数どおり", () => {
  assert.deepEqual(betKindSlots("win").labels, ["1着"]);
  assert.equal(betKindSlots("win").ordered, true);
  assert.deepEqual(betKindSlots("umaren").labels, ["1頭", "2頭"]);
  assert.equal(betKindSlots("umaren").ordered, false);
  assert.deepEqual(betKindSlots("umatan").labels, ["1着", "2着"]);
  assert.equal(betKindSlots("umatan").ordered, true);
  assert.deepEqual(betKindSlots("sanrenpuku").labels, ["1頭", "2頭", "3頭"]);
  assert.equal(betKindSlots("sanrenpuku").ordered, false);
  assert.deepEqual(betKindSlots("sanrentan").labels, ["1着", "2着", "3着"]);
  assert.equal(betKindSlots("sanrentan").ordered, true);
});
