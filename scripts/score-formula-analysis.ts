/**
 * 保存済み評価点を、複合回復金スキルを金+2へ戻した場合と比較する。
 * --remote を付けたときだけ本番D1を読む。DBは変更しない。
 */
import { execSync } from "node:child_process";
import { parseHorseScoreInput } from "../src/lib/horseScoreInput.ts";
import { scoreFromHorse } from "../src/lib/scoreFromHorse.ts";
import { isCompositeRecoveryGold } from "../src/lib/score.ts";
import { parseScoreSetup } from "../src/lib/scoreSetup.ts";
import type { StrategicSkillRow } from "../src/lib/strategicSkills.ts";

const DEFAULT_EVENT_ID = "276b3f48-338c-4add-9027-03f87a6f7d00";
const args = process.argv.slice(2);
const remote = args.includes("--remote");
const eventArg = args.find((arg) => arg.startsWith("--event="));
const EVENT_ID = eventArg?.slice("--event=".length) || DEFAULT_EVENT_ID;
type QueryResult<T> = { results: T[] };
type HorseRow = { id: string; sort_order: number; name: string; strength: number; score_input: string };
type EventRow = { score_setup: string };
type StrategicRow = StrategicSkillRow;

function query<T>(sql: string): T[] {
  const location = remote ? "--remote" : "--local";
  const raw = execSync("npx.cmd wrangler d1 execute oshi-keiba " + location + " --command \"" + sql.replace(/\"/g, "\\\"") + "\"", { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const begin = raw.indexOf("[\n  {");
  const end = raw.indexOf("\n]\n", begin);
  if (begin < 0 || end < 0) throw new Error("D1応答のJSONを読めませんでした");
  return (JSON.parse(raw.slice(begin, end + 2)) as QueryResult<T>[])[0]?.results ?? [];
}

const event = query<EventRow>("SELECT score_setup FROM events WHERE id = '" + EVENT_ID + "'")[0];
if (!event) throw new Error("対象イベントがありません");
const setup = parseScoreSetup(event.score_setup);
if (!setup) throw new Error("評価設定を読めませんでした");
const horses = query<HorseRow>("SELECT id, sort_order, name, strength, score_input FROM horses WHERE event_id = '" + EVENT_ID + "' ORDER BY sort_order");
const strategic = query<StrategicRow>("SELECT skill_id, name, points, memo, created_at FROM strategic_skills");

const n = setup.skillWeightN ?? 1;
const rows = horses.map((horse) => {
  const input = parseHorseScoreInput(horse.score_input);
  const scored = scoreFromHorse(setup, input, strategic);
  if (!input || !scored) throw new Error("再計算できません: " + horse.name);
  const counted = new Set(scored.breakdown.skill.countedNames);
  const skills = input.skillNames.flatMap((name, index) => {
    const id = input.skillIds[index] ?? null;
    return counted.has(name) && isCompositeRecoveryGold(name, id) ? [{ name, id }] : [];
  });
  const base = scored.breakdown.skill.base;
  const restoredBase = base + skills.length * 2;
  const restored = scored.breakdown.score * (restoredBase / base) ** n;
  return {
    order: horse.sort_order, name: horse.name, currentStrength: scored.strength, storedStrength: horse.strength,
    base, restoredBase, count: skills.length, skills: skills.map((s) => s.name),
    restoredStrength: Math.round(restored * 10) / 10,
    changePct: Math.round(((restored / scored.breakdown.score) - 1) * 1000) / 10,
  };
});
console.log(JSON.stringify({ eventId: EVENT_ID, source: remote ? "remote" : "local", n, total: rows.length, affected: rows.filter((r) => r.count > 0).length, totalSkills: rows.reduce((sum, r) => sum + r.count, 0), rows }, null, 2));
