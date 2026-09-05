import assert from "node:assert/strict";
import { test } from "node:test";
import { unwrapOcrPayload } from "./ocrGeminiJson.ts";

test("オブジェクトはそのまま", () => {
  const raw = { name: "アーモンドアイ", skills: ["地固め"] };
  assert.equal(unwrapOcrPayload(raw).name, "アーモンドアイ");
});

test("1要素配列は先頭オブジェクトを使う", () => {
  const raw = [{ name: "アーモンドアイ", trainerName: "あさくらりえ", skills: ["地固め"] }];
  const got = unwrapOcrPayload(raw);
  assert.equal(got.name, "アーモンドアイ");
  assert.equal(got.trainerName, "あさくらりえ");
});

test("空配列は失敗", () => {
  assert.throws(() => unwrapOcrPayload([]), /JSONの形が違います/);
});

test("配列の先頭がオブジェクトでないときは失敗", () => {
  assert.throws(() => unwrapOcrPayload(["x"]), /JSONの形が違います/);
});
