/**
 * 戦略例外スキル（グローバル）。U-tools 有効リストとは別レーン。
 * D1 が正本。export で JSON 資産化。
 */
import { greenSkillByName } from "./greenSkills.ts";
import { skillCountsInBase } from "./score.ts";

export type StrategicSkillRow = {
  skillId: number;
  name: string;
  points: number;
  memo: string;
};

export type StrategicSkillDismissedRow = {
  skillId: number;
  name: string;
};

export type SkillChip = {
  name: string;
  kind: string;
  id: number | null;
};

export type StrategicSkillChip = SkillChip & { points: number };

export type PartitionedSkills = {
  effective: SkillChip[];
  strategic: StrategicSkillChip[];
  greens: SkillChip[];
  rejected: SkillChip[];
  strategicPoints: number;
};

type DbLike = D1Database;

function nowIso(): string {
  return new Date().toISOString();
}

export function strategicMapFromRows(
  rows: readonly StrategicSkillRow[],
): Map<number, StrategicSkillRow> {
  return new Map(rows.map((r) => [r.skillId, r]));
}

export async function listStrategicSkills(db: DbLike): Promise<StrategicSkillRow[]> {
  const res = await db
    .prepare(
      "SELECT skill_id, name, points, memo FROM strategic_skills ORDER BY name",
    )
    .all<{ skill_id: number; name: string; points: number; memo: string }>();
  return (res.results ?? []).map((r) => ({
    skillId: r.skill_id,
    name: r.name,
    points: r.points,
    memo: r.memo ?? "",
  }));
}

export async function listStrategicDismissed(
  db: DbLike,
): Promise<StrategicSkillDismissedRow[]> {
  const res = await db
    .prepare("SELECT skill_id, name FROM strategic_skill_dismissed ORDER BY name")
    .all<{ skill_id: number; name: string }>();
  return (res.results ?? []).map((r) => ({
    skillId: r.skill_id,
    name: r.name,
  }));
}

export async function addStrategicSkill(
  db: DbLike,
  row: { skillId: number; name: string; points: number; memo?: string },
): Promise<void> {
  if (!Number.isFinite(row.skillId) || row.skillId <= 0) {
    throw new Error("スキル id が不正です");
  }
  const name = row.name.trim();
  if (!name) throw new Error("スキル名を入れてください");
  const points = row.points;
  if (!Number.isFinite(points) || points < 0) {
    throw new Error("点数が不正です");
  }
  await db
    .prepare(
      `INSERT INTO strategic_skills (skill_id, name, points, memo, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(skill_id) DO UPDATE SET
         name = excluded.name,
         points = excluded.points,
         memo = excluded.memo`,
    )
    .bind(row.skillId, name, points, (row.memo ?? "").trim(), nowIso())
    .run();
  await db
    .prepare("DELETE FROM strategic_skill_dismissed WHERE skill_id = ?")
    .bind(row.skillId)
    .run();
}

export async function removeStrategicSkill(db: DbLike, skillId: number): Promise<void> {
  await db.prepare("DELETE FROM strategic_skills WHERE skill_id = ?").bind(skillId).run();
}

export async function dismissStrategicSkill(
  db: DbLike,
  row: { skillId: number; name: string },
): Promise<void> {
  if (!Number.isFinite(row.skillId) || row.skillId <= 0) {
    throw new Error("スキル id が不正です");
  }
  const name = row.name.trim();
  if (!name) throw new Error("スキル名を入れてください");
  await db
    .prepare(
      `INSERT INTO strategic_skill_dismissed (skill_id, name, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(skill_id) DO UPDATE SET name = excluded.name`,
    )
    .bind(row.skillId, name, nowIso())
    .run();
}

export async function undismissStrategicSkill(db: DbLike, skillId: number): Promise<void> {
  await db
    .prepare("DELETE FROM strategic_skill_dismissed WHERE skill_id = ?")
    .bind(skillId)
    .run();
}

export async function exportStrategicSkillsJson(db: DbLike): Promise<string> {
  const skills = await listStrategicSkills(db);
  const dismissed = await listStrategicDismissed(db);
  return JSON.stringify(
    {
      exportedAt: nowIso(),
      skills: skills.map((s) => ({
        id: s.skillId,
        name: s.name,
        points: s.points,
        memo: s.memo,
      })),
      dismissed: dismissed.map((d) => ({ id: d.skillId, name: d.name })),
    },
    null,
    2,
  );
}

/** 読取確認用。戦略例外は U-tools 有効と二重計上しない */
export function partitionSkills(
  accepted: readonly SkillChip[],
  opts: {
    effectiveIds?: ReadonlySet<number> | null;
    strategicById: ReadonlyMap<number, StrategicSkillRow>;
  },
): PartitionedSkills {
  const effective: SkillChip[] = [];
  const strategic: StrategicSkillChip[] = [];
  const greens: SkillChip[] = [];
  const rejected: SkillChip[] = [];
  let strategicPoints = 0;

  for (const h of accepted) {
    const id = h.id;
    if (id != null && opts.strategicById.has(id)) {
      const row = opts.strategicById.get(id)!;
      strategic.push({ ...h, points: row.points });
      strategicPoints += row.points;
      continue;
    }
    if (greenSkillByName(h.name) != null) {
      greens.push(h);
      continue;
    }
    if (skillCountsInBase(h.name, h.id, opts.effectiveIds)) {
      effective.push(h);
      continue;
    }
    rejected.push(h);
  }

  return { effective, strategic, greens, rejected, strategicPoints };
}

/** 候補: 不採用のうち例外未登録・見送り未登録 */
export function strategicCandidates(
  rejected: readonly SkillChip[],
  strategicById: ReadonlyMap<number, StrategicSkillRow>,
  dismissedIds: ReadonlySet<number>,
): SkillChip[] {
  return rejected.filter((h) => {
    if (h.id == null) return false;
    if (strategicById.has(h.id)) return false;
    if (dismissedIds.has(h.id)) return false;
    return true;
  });
}
