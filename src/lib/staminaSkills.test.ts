import assert from "node:assert/strict";
import { test } from "node:test";
import {
  staminaSkillBreakdown,
  staminaSkillById,
  staminaSkillByName,
} from "./staminaSkills.ts";
import { ocrAdminScript, registerMaterialsHtml } from "./ocrAdmin.ts";

test("master.mdb の回復率と自己消費率を引ける", () => {
  assert.equal(staminaSkillByName("円弧のマエストロ")?.recovery, 550);
  assert.equal(staminaSkillById(202151)?.staminaCost, 200);
  assert.equal(staminaSkillByName("コーナー回復×"), undefined);
});

test("純回復は常に、複合回復と自己消費は有効時だけ採用する", () => {
  const names = ["円弧のマエストロ", "鋼の意志", "勇往邁進"];
  const ids = [200351, 200441, 202151];

  const onlyPure = staminaSkillBreakdown(names, ids, () => false);
  assert.equal(onlyPure.recoveryRate, 0.055);
  assert.equal(onlyPure.staminaCostRate, 0);
  assert.deepEqual(onlyPure.recoveries.map((skill) => skill.name), ["円弧のマエストロ"]);

  const all = staminaSkillBreakdown(names, ids, () => true);
  assert.equal(all.recoveryRate, 0.11);
  assert.equal(all.staminaCostRate, 0.02);
  assert.ok(Math.abs(all.netRate - 0.09) < 1e-12);
});

test("出走登録の材料に回復と自己消費の内訳を表示する", () => {
  const html = registerMaterialsHtml(
    {
      stats: { speed: 1200, stamina: 1000, power: 800, guts: 400, wisdom: 800 },
      aptitudes: { turf: "A", dirt: "G", short: "A", mile: "A", medium: "A", long: "A", nige: "A", senkou: "A", sashi: "A", oikomi: "A" },
      skillNames: ["円弧のマエストロ", "勇往邁進"],
      skillIds: [200351, 202151],
      styleKey: "betweener",
    },
    new Set([202151]),
  );
  assert.match(html, /回復スキル（合計 \+5\.5%）/);
  assert.match(html, /円弧のマエストロ/);
  assert.match(html, /スタミナ消費スキル（有効スキルに含まれる・合計 −2%）/);
  assert.match(html, /勇往邁進/);
  assert.ok(html.indexOf("スタミナ消費スキル") < html.indexOf("戦略例外スキル"));
  const rejected = html.slice(html.indexOf("不採用スキル"), html.indexOf("OCR落ちスキル"));
  assert.doesNotMatch(rejected, /円弧のマエストロ/);
});

test("OCR読取確認用のブラウザスクリプトを生成できる", () => {
  const html = ocrAdminScript(true);
  const source = html.replace(/^<script>/, "").replace(/<\/script>$/, "");
  assert.doesNotThrow(() => new Function(source));
});

test("composite recovery gold has a semi-gold chip", () => {
  const html = registerMaterialsHtml(
    {
      stats: { speed: 1200, stamina: 1000, power: 800, guts: 400, wisdom: 800 },
      aptitudes: { turf: "A", dirt: "G", short: "A", mile: "A", medium: "A", long: "A", nige: "A", senkou: "A", sashi: "A", oikomi: "A" },
      skillNames: ["鋼の意志", "地固め"],
      skillIds: [200441, 201601],
      styleKey: "betweener",
    },
    new Set([200441, 201601]),
  );
  assert.match(html, /鋼の意志<span class="reg-pts">準金 \+1<\/span>/);
  assert.doesNotMatch(html, /地固め<span class="reg-pts">準金 \+1<\/span>/);
  assert.match(html, /準金 1/);
});
