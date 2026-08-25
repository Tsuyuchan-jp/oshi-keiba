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

const skills = [];
const seen = new Set();
for (const m of listSrc.matchAll(
  /"name":\s*"([^"]+)"\s*,\s*"id":\s*"[^"]+"\s*,\s*"rarity":\s*"([^"]+)"/g,
)) {
  const name = m[1];
  if (seen.has(name)) continue;
  seen.add(name);
  let kind = m[2];
  if (rarityMap[name] === "green") kind = "green";
  else if (rarityMap[name] === "gold") kind = "gold";
  else if (kind === "rare") kind = "gold";
  skills.push({ name, kind });
}

const out = path.join("src", "data", "skill-catalog.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ skills })}\n`);
console.log(`wrote ${skills.length} skills (${skills.filter((s) => s.kind === "minus").length} minus)`);
