import assert from "node:assert/strict";
import { test } from "node:test";
import { clawbackBalance, joinButtonLabel } from "./lifecycle.ts";

test("参加ボタン: タイトルがあればそれを使う", () => {
  assert.equal(joinButtonLabel("第2回本戦"), "第2回本戦に参加する");
  assert.equal(joinButtonLabel("  "), "今回レースに参加する");
  assert.equal(joinButtonLabel(""), "今回レースに参加する");
});

test("G 巻き戻し: 持ち越しは残し、足りなければ 0", () => {
  assert.equal(clawbackBalance(18840, 3000), 15840);
  assert.equal(clawbackBalance(3000, 3000), 0);
  assert.equal(clawbackBalance(100, 3000), 0);
  assert.equal(clawbackBalance(500, 0), 500);
});
