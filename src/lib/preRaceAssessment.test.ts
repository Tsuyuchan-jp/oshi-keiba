import assert from "node:assert/strict";
import test from "node:test";
import { addHorse } from "./storeHorses";
import { ensureEvent } from "./storeEvent";
import { listHorses } from "./storeRead";
import {
  getPreRaceAssessmentSnapshot,
  listPreRaceAssessments,
  parsePreRaceAssessmentSnapshot,
  preRaceAssessmentSnapshotStatement,
  savePreRaceAssessments,
} from "./preRaceAssessment";
import { createMemoryD1 } from "./testD1";

async function fixture() {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await addHorse(db, event, "テスト一号", "A", { strength: 10, recordUndo: false });
  await addHorse(db, event, "テスト二号", "B", { strength: 9, recordUndo: false });
  const horses = await listHorses(db, event.id);
  return { db, event, horses };
}

test("運営の事前評価は部分的な順位とメモを保存できる", async () => {
  const { db, event, horses } = await fixture();
  await savePreRaceAssessments(db, event, horses, [
    { horseId: horses[0]!.id, rank: 1, memo: "本命" },
    { horseId: horses[1]!.id, rank: null, memo: null },
  ]);
  const saved = await listPreRaceAssessments(db, event.id);
  assert.deepEqual(saved.map((row) => ({ rank: row.rank, memo: row.memo })), [{ rank: 1, memo: "本命" }]);
});

test("運営の事前評価は順位の重複を拒否する", async () => {
  const { db, event, horses } = await fixture();
  await assert.rejects(
    () => savePreRaceAssessments(db, event, horses, [
      { horseId: horses[0]!.id, rank: 1, memo: null },
      { horseId: horses[1]!.id, rank: 1, memo: null },
    ]),
    /重複/,
  );
});

test("投票開始用のスナップショットは評価式と事前評価を残す", async () => {
  const { db, event, horses } = await fixture();
  await savePreRaceAssessments(db, event, horses, [
    { horseId: horses[0]!.id, rank: 1, memo: "本命" },
    { horseId: horses[1]!.id, rank: null, memo: null },
  ]);
  await db.batch([await preRaceAssessmentSnapshotStatement(db, event.id, 123)]);
  const snapshot = await getPreRaceAssessmentSnapshot(db, event.id);
  assert.equal(snapshot?.captured_at, 123);
  assert.match(snapshot?.formula_summary ?? "", /準金/);
  assert.deepEqual(parsePreRaceAssessmentSnapshot(snapshot), [
    { horseId: horses[0]!.id, rank: 1, memo: "本命" },
  ]);
});
