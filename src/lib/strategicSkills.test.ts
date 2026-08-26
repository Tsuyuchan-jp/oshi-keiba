import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryD1 } from "./testD1.ts";
import {
  addStrategicSkill,
  dismissStrategicSkill,
  listStrategicDismissed,
  listStrategicSkills,
  partitionSkills,
  removeStrategicSkill,
  strategicCandidates,
  strategicMapFromRows,
} from "./strategicSkills.ts";

test("partitionSkills: 戦略例外は U-tools 有効から除外", () => {
  const strategicById = strategicMapFromRows([
    { skillId: 200431, name: "コンセントレーション", points: 1, memo: "" },
  ]);
  const parts = partitionSkills(
    [
      { name: "地固め", kind: "white", id: 201601 },
      { name: "コンセントレーション", kind: "gold", id: 200431 },
    ],
    { effectiveIds: new Set([201601, 200431]), strategicById },
  );
  assert.equal(parts.effective.length, 1);
  assert.equal(parts.effective[0]?.name, "地固め");
  assert.equal(parts.strategic.length, 1);
  assert.equal(parts.strategicPoints, 1);
});

test("strategicCandidates: 見送り・登録済みは除外", () => {
  const strategicById = strategicMapFromRows([
    { skillId: 200431, name: "コンセントレーション", points: 1, memo: "" },
  ]);
  const rejected = [
    { name: "コンセントレーション", kind: "gold", id: 200431 },
    { name: "危険回避", kind: "white", id: 201262 },
    { name: "無id", kind: "white", id: null },
  ];
  const cand = strategicCandidates(rejected, strategicById, new Set([201262]));
  assert.deepEqual(
    cand.map((c) => c.id),
    [],
  );
  const cand2 = strategicCandidates(
    [{ name: "危険回避", kind: "white", id: 201262 }],
    strategicById,
    new Set(),
  );
  assert.deepEqual(
    cand2.map((c) => c.id),
    [201262],
  );
});

test("D1 CRUD: 追加・削除・見送り", async () => {
  const db = createMemoryD1();
  const initial = await listStrategicSkills(db);
  assert.ok(initial.length >= 4);

  await addStrategicSkill(db, {
    skillId: 999001,
    name: "テスト例外",
    points: 2,
    memo: "memo",
  });
  const rows = await listStrategicSkills(db);
  assert.ok(rows.some((r) => r.skillId === 999001 && r.points === 2));

  await dismissStrategicSkill(db, { skillId: 999001, name: "テスト例外" });
  const dismissed = await listStrategicDismissed(db);
  assert.ok(dismissed.some((d) => d.skillId === 999001));

  await removeStrategicSkill(db, 999001);
  const after = await listStrategicSkills(db);
  assert.ok(!after.some((r) => r.skillId === 999001));
});
