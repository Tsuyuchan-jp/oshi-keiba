/**
 * store 出走名簿（追加・修正・デモ・スクショ）
 */

import { newId } from "./auth";
import { composeHorseName } from "./horseName";
import { captureAdminUndo } from "./undo";
import { listHorses } from "./storeRead";
import {
  MAX_LIVE_HORSES,
  MAX_SHOT_BYTES,
  type AddHorseOpts,
  type EventRow,
  type UpdateHorseOpts,
} from "./storeTypes";

export type { AddHorseOpts, UpdateHorseOpts };
export { MAX_SHOT_BYTES };

const DEMO_HORSES: { umaName: string; runnerName: string; strength: number }[] = [
  { umaName: "仮・スペシャルウィーク", runnerName: "デモ", strength: 28 },
  { umaName: "仮・サイレンススズカ", runnerName: "デモ", strength: 22 },
  { umaName: "仮・トウカイテイオー", runnerName: "デモ", strength: 18 },
  { umaName: "仮・ゴールドシップ", runnerName: "デモ", strength: 14 },
  { umaName: "仮・メジロマックイーン", runnerName: "デモ", strength: 10 },
  { umaName: "仮・オグリキャップ", runnerName: "デモ", strength: 8 },
  { umaName: "仮・ダイワスカーレット", runnerName: "デモ", strength: 6 },
  { umaName: "仮・ウオッカ", runnerName: "デモ", strength: 5 },
  { umaName: "仮・エアグルーヴ", runnerName: "デモ", strength: 4 },
  { umaName: "仮・テイエムオペラオー", runnerName: "デモ", strength: 3 },
];

export async function addHorse(
  db: D1Database,
  event: EventRow,
  umaName: string,
  runnerName: string,
  opts: AddHorseOpts | number,
): Promise<string> {
  const o: AddHorseOpts =
    typeof opts === "number" ? { strength: opts } : opts;
  const recordUndo = o.recordUndo !== false;
  if (event.status !== "setup") {
    throw new Error("名簿は投票開始後は閉じます（飛び入り禁止）");
  }
  const uma = umaName.trim();
  const runner = runnerName.trim();
  if (!uma) throw new Error("ウマ娘名を入れてください");
  if (!runner) throw new Error("出走者を入れてください");
  if (!(o.strength >= 0)) throw new Error("相対評価点が不正です");
  const scoreInput =
    o.scoreInputJson == null || o.scoreInputJson === ""
      ? null
      : o.scoreInputJson;
  const combined = composeHorseName(uma, runner);
  const horses = await listHorses(db, event.id);
  const live = horses.filter((h) => h.scratched === 0).length;
  if (live >= MAX_LIVE_HORSES) {
    throw new Error(`頭数は ${MAX_LIVE_HORSES} まで`);
  }
  if (recordUndo) await captureAdminUndo(db, `出走を追加（${combined}）`);
  const source = o.seedSource === "auto" ? "auto" : "manual";
  const id = newId();
  await db
    .prepare(
      `INSERT INTO horses (
        id, event_id, name, uma_name, runner_name, chara_id, dress_id, strength, score_input, seed_source, scratched, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .bind(
      id,
      event.id,
      combined,
      uma,
      runner,
      o.charaId ?? null,
      o.dressId ?? null,
      o.strength,
      scoreInput,
      source,
      horses.length + 1,
      Date.now(),
    )
    .run();
  return id;
}

export async function updateHorse(
  db: D1Database,
  event: EventRow,
  horseId: string,
  umaName: string,
  runnerName: string,
  opts: UpdateHorseOpts | number,
): Promise<void> {
  const o: UpdateHorseOpts =
    typeof opts === "number" ? { strength: opts, keepScoreInput: true } : opts;
  const recordUndo = o.recordUndo !== false;
  if (event.status !== "setup") {
    throw new Error("セットアップ中だけ修正できます");
  }
  const uma = umaName.trim();
  const runner = runnerName.trim();
  if (!uma) throw new Error("ウマ娘名を入れてください");
  if (!runner) throw new Error("出走者を入れてください");
  if (!(o.strength >= 0)) throw new Error("相対評価点が不正です");
  const combined = composeHorseName(uma, runner);
  const horse = await db
    .prepare("SELECT id FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first();
  if (!horse) throw new Error("出走が見つかりません");
  if (recordUndo) await captureAdminUndo(db, `出走を修正（${combined}）`);
  if (o.keepScoreInput) {
    await db
      .prepare(
        "UPDATE horses SET name = ?, uma_name = ?, runner_name = ?, chara_id = ?, dress_id = ?, strength = ? WHERE id = ? AND event_id = ?",
      )
      .bind(combined, uma, runner, o.charaId ?? null, o.dressId ?? null, o.strength, horseId, event.id)
      .run();
    return;
  }
  const scoreInput =
    o.scoreInputJson == null || o.scoreInputJson === ""
      ? null
      : o.scoreInputJson;
  const source = o.seedSource === "auto" ? "auto" : "manual";
  await db
    .prepare(
      "UPDATE horses SET name = ?, uma_name = ?, runner_name = ?, chara_id = ?, dress_id = ?, strength = ?, score_input = ?, seed_source = ? WHERE id = ? AND event_id = ?",
    )
    .bind(combined, uma, runner, o.charaId ?? null, o.dressId ?? null, o.strength, scoreInput, source, horseId, event.id)
    .run();
}

/** setup 中だけ。取消（返還）ではなく登録そのものを消す */
export async function dropHorse(
  db: D1Database,
  event: EventRow,
  horseId: string,
): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("投票開始後は名簿から外せません。出走タブの取消を使ってください");
  }
  const row = await db
    .prepare("SELECT name FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first<{ name: string }>();
  if (!row) throw new Error("出走が見つかりません");
  await captureAdminUndo(db, `名簿から外す（${row.name}）`);
  await db
    .prepare("DELETE FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .run();
}

export async function setHorseShotKey(
  db: D1Database,
  event: EventRow,
  horseId: string,
  shotKey: string,
): Promise<void> {
  const horse = await db
    .prepare("SELECT id FROM horses WHERE id = ? AND event_id = ?")
    .bind(horseId, event.id)
    .first();
  if (!horse) throw new Error("出走が見つかりません");
  await db
    .prepare("UPDATE horses SET shot_key = ? WHERE id = ? AND event_id = ?")
    .bind(shotKey, horseId, event.id)
    .run();
}

export async function seedDemoHorses(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("セットアップ中だけデモ出走を入れられます");
  }
  const existing = await listHorses(db, event.id);
  if (existing.length > 0) throw new Error("すでに出走が登録されています");
  const now = Date.now();
  const stmts = DEMO_HORSES.map((h, i) =>
    db
      .prepare(
        `INSERT INTO horses (
          id, event_id, name, uma_name, runner_name, strength, seed_source, scratched, sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'manual', 0, ?, ?)`,
      )
      .bind(
        newId(),
        event.id,
        composeHorseName(h.umaName, h.runnerName),
        h.umaName,
        h.runnerName,
        h.strength,
        i + 1,
        now,
      ),
  );
  await db.batch(stmts);
}

/** setup 中の出走だけ消す */
export async function clearHorses(db: D1Database, event: EventRow): Promise<void> {
  if (event.status !== "setup") {
    throw new Error("出走を空にできるのは出走登録中だけです");
  }
  await captureAdminUndo(db, "出走を空にする");
  await db.prepare("DELETE FROM horses WHERE event_id = ?").bind(event.id).run();
}
