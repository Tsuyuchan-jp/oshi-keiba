/**
 * master.mdb から、自分の持久力を回復／消費するスキルを抽出する。
 * ability_type=9 の値は最大体力比の 1/10000 単位（550 = 5.5%）。
 * 相手への持久力デバフと、バッドスキルによる自己減少は収録しない。
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "data", "stamina-skills.json");
const MDB_CANDIDATES = [
  path.join(process.env.USERPROFILE || "", "AppData/LocalLow/Cygames/umamusume/master/master.mdb"),
  "D:/DMM/umamusumeDMM/Umamusume/umamusume_Data/Persistent/master/master.mdb",
  "D:/Umamusume/umamusume_Data/Persistent/master/master.mdb",
];

function resolveMdb() {
  const cli = process.argv.find((arg, i) => process.argv[i - 1] === "--mdb");
  if (cli && fs.existsSync(cli)) return cli;
  return MDB_CANDIDATES.find((candidate) => fs.existsSync(candidate)) ?? null;
}

const mdb = resolveMdb();
if (!mdb) throw new Error("master.mdb が見つかりません。--mdb でパスを渡してください。");

const db = new DatabaseSync(mdb, { readOnly: true });
const slotColumns = ["1_1", "1_2", "1_3", "2_1", "2_2", "2_3"];
const selectedColumns = slotColumns.flatMap((slot) => [
  `skill.ability_type_${slot}`,
  `skill.float_ability_value_${slot}`,
  `skill.target_type_${slot}`,
]);
const rows = db.prepare(`
  SELECT skill.id, name.text AS name, description.text AS description,
         ${selectedColumns.join(",\n         ")}
  FROM skill_data skill
  JOIN text_data name ON name.category = 47 AND name."index" = skill.id
  LEFT JOIN text_data description ON description.category = 48 AND description."index" = skill.id
  ORDER BY skill.id
`).all();

function effectsForGroup(row, group) {
  return [1, 2, 3]
    .map((index) => ({
      type: Number(row[`ability_type_${group}_${index}`]),
      value: Number(row[`float_ability_value_${group}_${index}`]),
      target: Number(row[`target_type_${group}_${index}`]),
    }))
    .filter((effect) => effect.type !== 0);
}

function largestGroupValue(groups, pick) {
  return Math.max(0, ...groups.map((effects) => pick(effects)));
}

const skills = [];
for (const row of rows) {
  const groups = [effectsForGroup(row, 1), effectsForGroup(row, 2)];
  // 条件1/2は別の発動分岐になり得るので合算せず、最大の分岐を採用する。
  const recovery = largestGroupValue(groups, (effects) =>
    effects
      .filter((effect) => effect.type === 9 && effect.target === 1 && effect.value > 0)
      .reduce((sum, effect) => sum + effect.value, 0),
  );
  const description = String(row.description ?? "");
  const describesConsumption = description.includes("持久力") && description.includes("使");
  const staminaCost = describesConsumption
    ? largestGroupValue(groups, (effects) =>
        effects
          .filter((effect) => effect.type === 9 && effect.target === 1 && effect.value < 0)
          .reduce((sum, effect) => sum + Math.abs(effect.value), 0),
      )
    : 0;
  if (recovery <= 0 && staminaCost <= 0) continue;

  const compoundRecovery = recovery > 0 && groups.some((effects) =>
    effects.some((effect) => effect.type !== 9),
  );
  skills.push({
    id: Number(row.id),
    name: String(row.name),
    recovery,
    staminaCost,
    compoundRecovery,
  });
}

const payload = {
  source: "master.mdb skill_data ability_type=9 target_type=1",
  scale: 10000,
  count: skills.length,
  skills,
};
fs.writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
console.log(`wrote ${skills.length} stamina skills: ${path.relative(ROOT, OUT)}`);
