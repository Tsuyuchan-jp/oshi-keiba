/**
 * skill-emulator の umasim 辞書から skill-catalog.json を生成する。
 * 照合の正は mdb id。ためらいは umasim 未収録なので末尾に足す。
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

/** umasim rarity → カタログ kind */
function mapKind(rarity, name) {
  if (rarityMap[name] === "green") return "green";
  if (rarityMap[name] === "gold") return "gold";
  if (rarity === "rare") return "gold";
  if (rarity === "white") return "white";
  return rarity;
}

const skills = [];
const seen = new Set();
for (const m of listSrc.matchAll(
  /"name":\s*"([^"]+)"\s*,\s*"id":\s*"(\d+)"\s*,\s*"rarity":\s*"([^"]+)"/g,
)) {
  const name = m[1];
  const id = Number(m[2]);
  if (seen.has(name)) continue;
  seen.add(name);
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
  if (seen.has(t.name)) continue;
  seen.add(t.name);
  skills.push(t);
}

const out = path.join("src", "data", "skill-catalog.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ skills })}\n`);
console.log(
  `wrote ${skills.length} skills (minus ${skills.filter((s) => s.kind === "minus").length}, tamerai ${TAMERAI.length})`,
);
