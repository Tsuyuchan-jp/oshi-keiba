/**
 * skill-emulator の umasim 辞書から skill-catalog.json を生成する。
 * 照合の正は mdb id。ためらいは umasim 未収録なので末尾に足す。
 *
 * 旧: 名前1件化は id 無し時代（枠色 kind 用）の名残。
 * 今: 評価点は id 照合のため、同名の unique / inherit / special などをすべて残す。
 */
import fs from "node:fs";
import path from "node:path";

const emu = path.join(
  process.env.USERPROFILE ?? "",
  "Documents",
  "google antigravity",
  "umamusume-skill-emulator",
  "desktop-app",
  "app",
  "lib",
);

const listSrc = fs.readFileSync(path.join(emu, "umasimSkillData.ts"), "utf8");
const raritySrc = fs.readFileSync(path.join(emu, "skillRarityData.ts"), "utf8");

/** @type {Record<string, string>} */
const rarityMap = {};
for (const m of raritySrc.matchAll(/"([^"]+)":\s*"(white|gold|green)"/g)) {
  rarityMap[m[1]] = m[2];
}

/** umasim の固有系 rarity はそのまま残す（枠色上書きで unique を潰さない） */
const KEEP_RARITY = new Set([
  "unique",
  "inherit",
  "special",
  "evo",
  "minus",
  "scenario",
]);

/** umasim rarity → カタログ kind */
function mapKind(rarity, name) {
  if (KEEP_RARITY.has(rarity)) return rarity;
  if (rarityMap[name] === "green") return "green";
  if (rarityMap[name] === "gold") return "gold";
  if (rarity === "rare") return "gold";
  if (rarity === "white") return "white";
  return rarity;
}

const skills = [];
/** @type {Set<number>} */
const seenIds = new Set();
for (const m of listSrc.matchAll(
  /"name":\s*"([^"]+)"\s*,\s*"id":\s*"(\d+)"\s*,\s*"rarity":\s*"([^"]+)"/g,
)) {
  const name = m[1];
  const id = Number(m[2]);
  if (!Number.isFinite(id) || seenIds.has(id)) continue;
  seenIds.add(id);
  skills.push({ name, kind: mapKind(m[3], name), id });
}

/** ためらい4種（umasim 未収録・評価点は白1） */
const TAMERAI = [
  { name: "逃げためらい", kind: "white", id: 200851 },
  { name: "先行ためらい", kind: "white", id: 200881 },
  { name: "差しためらい", kind: "white", id: 200911 },
  { name: "追込ためらい", kind: "white", id: 200941 },
];
for (const t of TAMERAI) {
  if (seenIds.has(t.id)) continue;
  seenIds.add(t.id);
  skills.push(t);
}

const out = path.join("src", "data", "skill-catalog.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ skills })}\n`);

const inherit = skills.filter((s) => s.kind === "inherit").length;
const special = skills.filter((s) => s.kind === "special").length;
const unique = skills.filter((s) => s.kind === "unique").length;
console.log(
  `wrote ${skills.length} skills (unique ${unique}, inherit ${inherit}, special ${special}, minus ${skills.filter((s) => s.kind === "minus").length}, tamerai ${TAMERAI.length})`,
);
