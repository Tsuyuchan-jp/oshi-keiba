import assert from "node:assert/strict";
import { test } from "node:test";
import { addHorse, ensureEvent } from "./store.ts";
import { createMemoryD1 } from "./testD1.ts";
import {
  cancelRestoredShotDeletes,
  isShotKeyReferenced,
  listAllHorseAssetKeys,
  listPendingShotDeletes,
  queueShotDeletes,
} from "./shotCleanup.ts";

test("R2 削除予定は参照が復活した画像を保留対象から外す", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  const horseId = await addHorse(db, event, "テストウマ娘", "テスト出走者", { strength: 1, recordUndo: false });
  await db.prepare("UPDATE horses SET shot_key = ?, trainer_icon_key = ? WHERE id = ?")
    .bind("shots/a", "icons/a", horseId).run();

  await queueShotDeletes(db, ["shots/a", "icons/a", "missing"]);
  assert.deepEqual(await listAllHorseAssetKeys(db), ["shots/a", "icons/a"]);
  assert.equal(await isShotKeyReferenced(db, "shots/a"), true);
  await cancelRestoredShotDeletes(db);
  assert.deepEqual(await listPendingShotDeletes(db), ["missing"]);

  await db.prepare("DELETE FROM horses WHERE id = ?").bind(horseId).run();
  assert.equal(await isShotKeyReferenced(db, "shots/a"), false);
});
