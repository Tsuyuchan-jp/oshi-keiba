import assert from "node:assert/strict";
import { test } from "node:test";
import { wakuOf } from "./umabashiraWaku.ts";

test("8頭以下はウマ番が枠番", () => {
  assert.equal(wakuOf(1, 8), 1);
  assert.equal(wakuOf(8, 8), 8);
  assert.equal(wakuOf(3, 4), 3);
});

test("16頭は各枠2頭。1・2が白、15・16が桃", () => {
  assert.equal(wakuOf(1, 16), 1);
  assert.equal(wakuOf(2, 16), 1);
  assert.equal(wakuOf(3, 16), 2);
  assert.equal(wakuOf(4, 16), 2);
  assert.equal(wakuOf(15, 16), 8);
  assert.equal(wakuOf(16, 16), 8);
});

test("18頭は7・8枠が3頭", () => {
  assert.equal(wakuOf(11, 18), 6);
  assert.equal(wakuOf(12, 18), 6);
  assert.equal(wakuOf(13, 18), 7);
  assert.equal(wakuOf(15, 18), 7);
  assert.equal(wakuOf(16, 18), 8);
  assert.equal(wakuOf(18, 18), 8);
});

test("9〜18頭の枠割りを全頭ぶん確認する", () => {
  const expected = new Map<number, string>([
    [9, "123456788"],
    [10, "1234567788"],
    [11, "12345667788"],
    [12, "123455667788"],
    [13, "1234455667788"],
    [14, "12334455667788"],
    [15, "122334455667788"],
    [16, "1122334455667788"],
    [17, "11223344556677788"],
    [18, "112233445566777888"],
  ]);

  for (const [headCount, frames] of expected) {
    const actual = Array.from({ length: headCount }, (_, index) => wakuOf(index + 1, headCount)).join("");
    assert.equal(actual, frames, `${headCount}頭`);
  }
});
