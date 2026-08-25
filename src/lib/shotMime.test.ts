import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeShotMime } from "./shotMime.ts";

test("png / jpeg / webp を通す", () => {
  assert.equal(normalizeShotMime("image/png"), "image/png");
  assert.equal(normalizeShotMime("image/jpeg"), "image/jpeg");
  assert.equal(normalizeShotMime("image/webp"), "image/webp");
});

test("image/jpg を jpeg に正規化する", () => {
  assert.equal(normalizeShotMime("image/jpg"), "image/jpeg");
});

test("type が空なら拡張子から推定する", () => {
  assert.equal(normalizeShotMime("", "shot.webp"), "image/webp");
  assert.equal(normalizeShotMime("", "shot.PNG"), "image/png");
  assert.equal(normalizeShotMime("", "a.JPG"), "image/jpeg");
});

test("未対応は null", () => {
  assert.equal(normalizeShotMime("image/gif"), null);
  assert.equal(normalizeShotMime("", "a.gif"), null);
  assert.equal(normalizeShotMime(""), null);
});
