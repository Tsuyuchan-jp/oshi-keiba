/**
 * master.mdb の skill_category=0（緑のステ上昇）を src/data/green-skills.json にする。
 * 上昇量は ability_type 1〜5（速スタパ根賢）の float 値 / 10000。
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "data", "green-skills.json");
const STAT = { 1: "speed", 2: "stamina", 3: "power", 4: "guts", 5: "wisdom" };

const MDB_CANDIDATES = [
  path.join(process.env.USERPROFILE || "", "AppData/LocalLow/Cygames/umamusume/master/master.mdb"),
  "D:/DMM/umamusumeDMM/Umamusume/umamusume_Data/Persistent/master/master.mdb",
  "D:/Umamusume/umamusume_Data/Persistent/master/master.mdb",
];

function resolveMdb() {
  const cli = process.argv.find((a, i) => process.argv[i - 1] === "--mdb");
  if (cli && fs.existsSync(cli)) return cli;
  for (const p of MDB_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const mdbPath = resolveMdb();
if (!mdbPath) {
  console.error("master.mdb が見つかりません。--mdb でパスを渡してください。");
  process.exit(1);
}

const db = new DatabaseSync(mdbPath, { readOnly: true });
const names = new Map(
  db
    .prepare(`SELECT "index", text FROM text_data WHERE category = 47`)
    .all()
    .map((r) => [Number(r.index), r.text]),
);

const rows = db
  .prepare(
    `SELECT id, group_rate, condition_1,
            ability_type_1_1, float_ability_value_1_1,
            ability_type_1_2, float_ability_value_1_2,
            ability_type_1_3, float_ability_value_1_3
     FROM skill_data WHERE skill_category = 0 ORDER BY id`,
  )
  .all();

const skills = [];
for (const r of rows) {
  const bonus = { speed: 0, stamina: 0, power: 0, guts: 0, wisdom: 0 };
  const slots = [
    [r.ability_type_1_1, r.float_ability_value_1_1],
    [r.ability_type_1_2, r.float_ability_value_1_2],
    [r.ability_type_1_3, r.float_ability_value_1_3],
  ];
  for (const [t, v] of slots) {
    const key = STAT[t];
    if (key) bonus[key] += Math.round(Number(v) / 10000);
  }
  skills.push({
    id: Number(r.id),
    name: names.get(Number(r.id)) || `skill_${r.id}`,
    condition: String(r.condition_1 || ""),
    minus: Number(r.group_rate) < 0,
    ...bonus,
  });
}

const payload = {
  source: "master.mdb skill_data skill_category=0",
  scale: 10000,
  count: skills.length,
  skills,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
console.log(`wrote ${skills.length} greens → ${path.relative(ROOT, OUT)}`);
