import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeRscChunks,
  parseEffectiveSkillIdsByStyle,
  parseRankedSkillIdsFromHtml,
  resolveEffectStyleKey,
} from "./utoolsEffects.ts";

/** RSC チャンク1本分の HTML */
function htmlWithRsc(inner: string): string {
  const escaped = inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `self.__next_f.push([1,"${escaped}"])`;
}

test("脚質キー解決", () => {
  assert.equal(resolveEffectStyleKey("逃"), "runner");
  assert.equal(resolveEffectStyleKey("先行"), "leader");
  assert.equal(resolveEffectStyleKey("差"), "betweener");
  assert.equal(resolveEffectStyleKey("chaser"), "chaser");
  assert.equal(resolveEffectStyleKey("不明"), null);
});

test("RSC から ranked id を取る（金も含む）", () => {
  const inner = [
    `"id":201001,"rarity":1,"skillName":"左回り○","expectedEffect":2.1`,
    `"id":201010,"rarity":2,"skillName":"直線巧者","expectedEffect":4.0`,
    `"id":900001,"rarity":1,"skillName":"セイリオス","expectedEffect":9.9`,
  ].join(",");
  const ids = parseRankedSkillIdsFromHtml(htmlWithRsc(inner));
  assert.deepEqual(ids, [201001, 201010, 900001]);
  assert.ok(decodeRscChunks(htmlWithRsc(inner)).includes("expectedEffect"));
});

test("effectiveSkillIds の形を検証", () => {
  const ok = parseEffectiveSkillIdsByStyle({
    runner: [1, 2],
    leader: [3],
    betweener: [4],
    chaser: [5, 6],
  });
  assert.ok(ok);
  assert.equal(ok!.runner.length, 2);
  assert.equal(
    parseEffectiveSkillIdsByStyle({
      runner: [1],
      leader: [],
      betweener: [2],
      chaser: [3],
    }),
    null,
  );
});
