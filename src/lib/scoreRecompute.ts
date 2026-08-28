/** setup 中の自動評価点を、現在の開催条件で揃える。 */
import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { scoreFromHorse } from "./scoreFromHorse.ts";
import { listHorses } from "./storeRead.ts";
import type { EventRow } from "./storeTypes.ts";
import type { EventScoreSetup } from "./scoreSetup.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";

export type ScoreRecomputeChange = {
  horseId: string;
  name: string;
  before: number;
  after: number;
  characterSpecMultiplier: number;
};

export async function prepareAutoScoreRecompute(
  db: D1Database,
  event: EventRow,
  setup: EventScoreSetup | null,
  strategicSkills: readonly StrategicSkillRow[],
): Promise<ScoreRecomputeChange[]> {
  if (event.status !== "setup") throw new Error("評価点を再計算できるのは出走登録中だけです");
  if (!setup) throw new Error("評価条件が未設定です");
  const changes: ScoreRecomputeChange[] = [];
  for (const horse of await listHorses(db, event.id)) {
    if (horse.seed_source !== "auto") continue;
    const auto = scoreFromHorse(setup, parseHorseScoreInput(horse.score_input), strategicSkills);
    if (!auto) throw new Error(`自動算出できない出走があります: ${horse.name}`);
    if (auto.strength !== horse.strength) changes.push({ horseId: horse.id, name: horse.name, before: horse.strength, after: auto.strength, characterSpecMultiplier: auto.breakdown.characterSpec.multiplier });
  }
  return changes;
}

export async function applyAutoScoreRecompute(
  db: D1Database,
  changes: readonly ScoreRecomputeChange[],
): Promise<void> {
  if (!changes.length) return;
  await db.batch(changes.map((x) => db.prepare("UPDATE horses SET strength = ? WHERE id = ?").bind(x.after, x.horseId)));
}
