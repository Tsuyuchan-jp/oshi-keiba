import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("public/twinkle/texts/229_overlay_vertical.csv", "utf8").replace(/^\uFEFF/, "");
const lines = raw.trim().split(/\r?\n/).slice(1);
const seen = new Set();
const overlays = [];
for (const line of lines) {
  const i = line.indexOf(",");
  if (i < 0) continue;
  const text = line.slice(i + 1);
  const [before, after = ""] = text.split("\\n");
  const slogan = after === "<character_name>" ? before : after;
  if (!slogan || seen.has(slogan)) continue;
  seen.add(slogan);
  overlays.push({ before, after, slogan });
}
writeFileSync("src/data/gougai-overlays.json", `${JSON.stringify({ overlays }, null, 2)}\n`);
console.log(overlays.length);
console.log(overlays.find((o) => o.slogan.includes("チャンピオン")));
