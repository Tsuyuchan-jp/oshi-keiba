import assert from "node:assert/strict";
import { test } from "node:test";
import { resolvePetitImageUrl, resolveUmaDress } from "./umaDress.ts";
import { addHorse, ensureEvent, listHorses } from "./store.ts";
import { createMemoryD1 } from "./testD1.ts";

test("衣装 ID から収録済み petit 0010 の URL を解決する", () => {
  assert.equal(resolvePetitImageUrl(1001, 100101), "/images/umamusume/petit/petit_1001_100101_0010.png");
});

test("ID 不足・未収録の衣装には画像 URL を返さない", () => {
  assert.equal(resolvePetitImageUrl(null, 100101), null);
  assert.equal(resolvePetitImageUrl(1001, 999999), null);
});

test("正規のウマ娘名と衣装名からのみ衣装を確定する", () => {
  const hit = resolveUmaDress("スペシャルウィーク", "スペシャルドリーマ");
  assert.deepEqual(hit && [hit.charaId, hit.dressId], [1001, 100101]);
  assert.equal(resolveUmaDress("スペシャルウィーク", "存在しない衣装"), null);
});

test("一意な OCR 一文字誤読は衣装名でも補正する", () => {
  const hit = resolveUmaDress("スペシャルウィーク", "スペシャルドリーマー");
  assert.equal(hit?.dressId, 100101);
});

test("衣装 ID は出走馬に保存され、ID 未指定も後方互換である", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await addHorse(db, event, "スペシャルウィーク", "テスト", { strength: 1, charaId: 1001, dressId: 100101 });
  await addHorse(db, event, "既存形式", "テスト", { strength: 1 });
  const rows = await listHorses(db, event.id);
  assert.deepEqual([rows[0]!.chara_id, rows[0]!.dress_id], [1001, 100101]);
  assert.deepEqual([rows[1]!.chara_id, rows[1]!.dress_id], [null, null]);
});
