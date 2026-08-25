import assert from "node:assert/strict";
import { test } from "node:test";
import { composeHorseName, parseHorseName } from "./horseName.ts";
import { classifySkillName } from "./skillCatalog.ts";

test("結合名をウマ娘と出走者に分ける", () => {
  assert.deepEqual(parseHorseName("アーモンドアイ（つゆちゃん）"), {
    umaName: "アーモンドアイ",
    runnerName: "つゆちゃん",
  });
  assert.deepEqual(parseHorseName("仮・スペシャルウィーク"), {
    umaName: "仮・スペシャルウィーク",
    runnerName: "",
  });
});

test("ウマ娘名と出走者を結合する", () => {
  assert.equal(composeHorseName("セイウンスカイ", "neko"), "セイウンスカイ（neko）");
  assert.equal(composeHorseName("スペシャルウィーク", ""), "スペシャルウィーク");
});

test("デバフは未分類に落とさない", () => {
  const hit = classifySkillName("右回り×");
  assert.equal(hit.kind, "minus");
});
