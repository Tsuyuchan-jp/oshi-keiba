/** master.mdb から、OCR 照合用の育成ウマ娘・衣装カタログを生成する。 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "data", "uma-dress-catalog.json");
const PETIT = path.join(ROOT, "public", "images", "umamusume", "petit");
const FALLBACK = "D:/DMM/umamusumeDMM/Umamusume/umamusume_Data/Persistent/master/master.mdb";
const cli = process.argv.find((arg, i) => process.argv[i - 1] === "--mdb");
const mdb = cli ?? FALLBACK;
if (!fs.existsSync(mdb)) throw new Error(`master.mdb が見つかりません: ${mdb}`);

const db = new DatabaseSync(mdb, { readOnly: true });
const rows = db.prepare(`
  SELECT d.chara_id, d.id AS dress_id, chara.text AS chara_name,
         dress.text AS dress_name, all_name.text AS full_name
  FROM dress_data d
  JOIN card_data card ON card.id = d.id AND card.chara_id = d.chara_id
  JOIN text_data chara ON chara.category = 6 AND chara."index" = d.chara_id
  JOIN text_data dress ON dress.category = 5 AND dress."index" = d.id
  JOIN text_data all_name ON all_name.category = 4 AND all_name."index" = d.id
  WHERE d.chara_id BETWEEN 1000 AND 1999 AND d.have_mini = 1
  ORDER BY d.chara_id, d.id
`).all();
const dresses = rows
  .map((r) => ({
    charaId: Number(r.chara_id), dressId: Number(r.dress_id),
    charaName: String(r.chara_name), dressName: String(r.dress_name), fullName: String(r.full_name),
  }))
  .filter((r) => fs.existsSync(path.join(PETIT, `petit_${r.charaId}_${r.dressId}_0010.png`)));
fs.writeFileSync(OUT, `${JSON.stringify({ source: "master.mdb", dresses })}\n`);
console.log(`wrote ${dresses.length} dresses: ${path.relative(ROOT, OUT)}`);
