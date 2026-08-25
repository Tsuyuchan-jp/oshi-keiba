/**
 * U-tools 金ドット36コースを src/data/score-courses.json にする。
 * ラベルは inherit-skill-list の courses.json、mdb 値は uma-course-extract の all_courses.json。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "data", "score-courses.json");
const PROJECTS = path.resolve(ROOT, "..");

const INHERIT = path.join(PROJECTS, "umamusume-inherit-skill-list");
const COURSE_EXTRACT = path.join(PROJECTS, "uma-course-extract");

const DIST = { 短距離: 1, マイル: 2, 中距離: 3, 長距離: 4 };

function mustRead(p) {
  if (!fs.existsSync(p)) {
    console.error(`見つかりません: ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const available = mustRead(path.join(INHERIT, "data", "effects", "available.json"));
const utCourses = mustRead(path.join(INHERIT, "data", "courses.json")).courses;
const allMaster = mustRead(path.join(COURSE_EXTRACT, "output", "all_courses.json"));

const byUt = new Map(utCourses.map((c) => [c.id, c]));
const byMaster = new Map(allMaster.map((c) => [c.courseSetId, c]));

const ids = [...available.courseIds].sort((a, b) => a - b);
const courses = [];
for (const id of ids) {
  const u = byUt.get(id);
  const row = byMaster.get(id);
  if (!u || !row) {
    console.error(`コース欠落: ${id}`);
    process.exit(1);
  }
  const m = row.master;
  const distanceType = DIST[u.distClass];
  if (!distanceType) {
    console.error(`distanceType 不明: ${id} ${u.distClass}`);
    process.exit(1);
  }
  courses.push({
    courseKey: String(id),
    label: u.name,
    place: u.place,
    trackId: m.raceTrackId,
    rotation: m.turn,
    groundType: m.ground,
    distanceType,
    courseDistance: m.distance,
  });
}

const payload = {
  source: "U-tools 金ドット36 + race_course_set + inherit courses.json",
  count: courses.length,
  courses,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
console.log(`score-courses: ${courses.length} → ${OUT}`);
