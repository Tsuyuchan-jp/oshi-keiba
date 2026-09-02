/** R2 画像の削除予定。Undo が失効するまで実体の削除を保留する。 */

export async function listPendingShotDeletes(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT object_key FROM r2_pending_deletions ORDER BY created_at")
    .all<{ object_key: string }>();
  return (results ?? []).map((row) => row.object_key);
}

export async function queueShotDeletes(db: D1Database, keys: Array<string | null | undefined>): Promise<void> {
  const unique = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  if (!unique.length) return;
  await db.batch(unique.map((key) => db
    .prepare("INSERT OR IGNORE INTO r2_pending_deletions (object_key, created_at) VALUES (?, ?)")
    .bind(key, Date.now())));
}

export async function removePendingShotDelete(db: D1Database, key: string): Promise<void> {
  await db.prepare("DELETE FROM r2_pending_deletions WHERE object_key = ?").bind(key).run();
}

export async function listAllHorseAssetKeys(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT shot_key, trainer_icon_key FROM horses")
    .all<{ shot_key: string | null; trainer_icon_key: string | null }>();
  return (results ?? []).flatMap((row) => [row.shot_key, row.trainer_icon_key]).filter((key): key is string => Boolean(key));
}

/** Undo 等で再び参照されたキーは削除予定から外す。 */
export async function isShotKeyReferenced(db: D1Database, key: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM horses WHERE shot_key = ? OR trainer_icon_key = ? LIMIT 1")
    .bind(key, key)
    .first();
  return row != null;
}

export async function cancelRestoredShotDeletes(db: D1Database): Promise<void> {
  const keys = await listPendingShotDeletes(db);
  for (const key of keys) {
    if (await isShotKeyReferenced(db, key)) await removePendingShotDelete(db, key);
  }
}
