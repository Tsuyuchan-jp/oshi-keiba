import assert from "node:assert/strict";
import { test } from "node:test";
import { strategicSkillsAdminScript } from "./strategicSkillsAdmin.ts";

/** 出走登録ページ用インライン script の構文チェック */
function scriptBody(html: string): string {
  return html.replace(/^<script>\n/, "").replace(/\n<\/script>$/, "");
}

test("strategicSkillsAdminScript: 生成 JS に構文エラーがない", () => {
  const html = strategicSkillsAdminScript(true, {
    skills: [
      { skillId: 210052, name: "アオハル点火・賢", points: 1, memo: "" },
      { skillId: 200431, name: "コンセントレーション", points: 1, memo: "金だが+2なし" },
    ],
    dismissed: [],
  });
  assert.doesNotThrow(() => {
    new Function(scriptBody(html));
  });
});
