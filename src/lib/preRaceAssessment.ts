import { SCORE_FORMULA_SUMMARY, SCORE_FORMULA_VERSION } from "./score";
import type { EventRow, HorseRow } from "./storeTypes";
import { captureAdminUndo } from "./undo";

export type PreRaceAssessment = {
  event_id: string;
  horse_id: string;
  rank: number | null;
  memo: string | null;
  updated_at: number;
};

export type PreRaceAssessmentInput = {
  horseId: string;
  rank: number | null;
  memo: string | null;
};

export type PreRaceAssessmentSnapshot = {
  event_id: string;
  captured_at: number;
  formula_version: string;
  formula_summary: string;
  assessments_json: string;
};

function normalizeMemo(value: string | null): string | null {
  const memo = (value ?? "").trim();
  if (memo.length > 120) throw new Error("事前評価メモは120文字以内で入力してください");
  return memo || null;
}

export async function listPreRaceAssessments(
  db: D1Database,
  eventId: string,
): Promise<PreRaceAssessment[]> {
  const { results } = await db
    .prepare("SELECT * FROM pre_race_assessments WHERE event_id = ? ORDER BY rank IS NULL, rank, updated_at, horse_id")
    .bind(eventId)
    .all<PreRaceAssessment>();
  return results ?? [];
}

export async function savePreRaceAssessments(
  db: D1Database,
  event: EventRow,
  horses: readonly HorseRow[],
  values: readonly PreRaceAssessmentInput[],
): Promise<number> {
  if (event.status !== "setup") throw new Error("運営の事前評価は投票開始前だけ編集できます");
  const liveIds = new Set(horses.filter((horse) => !horse.scratched).map((horse) => horse.id));
  if (values.length !== liveIds.size || new Set(values.map((value) => value.horseId)).size !== values.length) {
    throw new Error("出走馬の事前評価データを正しく受け取れませんでした");
  }
  const seenRanks = new Set<number>();
  const rows = values.map((value) => {
    if (!liveIds.has(value.horseId)) throw new Error("出走していない馬の事前評価は記録できません");
    const rank = value.rank;
    if (rank != null && (!Number.isInteger(rank) || rank < 1 || rank > liveIds.size)) {
      throw new Error(`順位は1〜${liveIds.size}で入力してください`);
    }
    if (rank != null && seenRanks.has(rank)) throw new Error("順位が重複しています");
    if (rank != null) seenRanks.add(rank);
    return { horseId: value.horseId, rank, memo: normalizeMemo(value.memo) };
  }).filter((row) => row.rank != null || row.memo != null);
  const now = Date.now();
  await captureAdminUndo(db, "運営の事前評価を保存");
  await db.batch([
    db.prepare("DELETE FROM pre_race_assessments WHERE event_id = ?").bind(event.id),
    ...rows.map((row) => db.prepare(
      "INSERT INTO pre_race_assessments (event_id, horse_id, rank, memo, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(event.id, row.horseId, row.rank, row.memo, now)),
  ]);
  return rows.length;
}

export async function getPreRaceAssessmentSnapshot(
  db: D1Database,
  eventId: string,
): Promise<PreRaceAssessmentSnapshot | null> {
  return db.prepare("SELECT * FROM pre_race_assessment_snapshots WHERE event_id = ?")
    .bind(eventId)
    .first<PreRaceAssessmentSnapshot>();
}

export async function preRaceAssessmentSnapshotStatement(
  db: D1Database,
  eventId: string,
  now: number,
): Promise<D1PreparedStatement> {
  const assessments = await listPreRaceAssessments(db, eventId);
  const records = assessments.map((assessment) => ({
    horseId: assessment.horse_id,
    rank: assessment.rank,
    memo: assessment.memo,
  }));
  return db.prepare(
    `INSERT OR REPLACE INTO pre_race_assessment_snapshots
      (event_id, captured_at, formula_version, formula_summary, assessments_json)
      VALUES (?, ?, ?, ?, ?)`,
  ).bind(
    eventId,
    now,
    SCORE_FORMULA_VERSION,
    SCORE_FORMULA_SUMMARY,
    JSON.stringify(records),
  );
}

export function parsePreRaceAssessmentSnapshot(
  snapshot: PreRaceAssessmentSnapshot | null,
): PreRaceAssessmentInput[] {
  if (!snapshot) return [];
  try {
    const parsed: unknown = JSON.parse(snapshot.assessments_json);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as { horseId?: unknown; rank?: unknown; memo?: unknown };
      if (typeof item.horseId !== "string") return [];
      return [{
        horseId: item.horseId,
        rank: Number.isInteger(item.rank) ? Number(item.rank) : null,
        memo: typeof item.memo === "string" ? item.memo : null,
      }];
    });
  } catch {
    return [];
  }
}
