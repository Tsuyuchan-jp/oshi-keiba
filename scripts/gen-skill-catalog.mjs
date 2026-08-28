/** master.mdb を正本に OCR 用の総合スキル辞書を生成する。 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "data", "skill-catalog.json");
const FALLBACK = "D:/DMM/umamusumeDMM/Umamusume/umamusume_Data/Persistent/master/master.mdb";
const cli = process.argv.find((arg, i) => process.argv[i - 1] === "--mdb");
const mdb = cli ?? FALLBACK;
if (!fs.existsSync(mdb)) throw new Error(`master.mdb が見つかりません: ${mdb}`);

// 既存の個別分類は評価ロジックに影響するため、同じ ID では維持する。
// 新規 ID は master の rarity / skill_category だけで安全に分類する。
const previous = JSON.parse(fs.readFileSync(OUT, "utf8")).skills;
const previousKind = new Map(previous.map((row) => [Number(row.id), String(row.kind)]));
const db = new DatabaseSync(mdb, { readOnly: true });
const rows = db.prepare(`
  SELECT skill.id, skill.rarity, skill.skill_category, text.text AS name
  FROM skill_data skill JOIN text_data text ON text.category = 47 AND text."index" = skill.id
  ORDER BY skill.id
`).all();

function fallbackKind(row) {
  if (Number(row.skill_category) === 0) return "green";
  if (Number(row.rarity) === 2) return "gold";
  if ([3, 4, 5].includes(Number(row.rarity))) return "unique";
  if (Number(row.rarity) === 6) return "evo";
  return "white";
}

const skills = rows.map((row) => ({
  id: Number(row.id), name: String(row.name),
  kind: previousKind.get(Number(row.id)) ?? fallbackKind(row),
}));
fs.writeFileSync(OUT, `${JSON.stringify({ source: "master.mdb", skills })}\n`);
console.log(`wrote ${skills.length} skills: ${path.relative(ROOT, OUT)}`);
