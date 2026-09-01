import assert from "node:assert/strict";
import { test } from "node:test";
import { adminParamsFromForm } from "./adminParams.ts";

const valid = { title: "第1レース", grant_g: "1000", bet_unit: "100", seed_pool_s: "500", pull_e: "0", takeout_d: "0.2", w_time_floor: "0.1", w_time_exp: "1.5", closes_at: "" };
const parse = (overrides: Record<string, string> = {}) => {
  const values = { ...valid, ...overrides };
  return adminParamsFromForm((name) => values[name as keyof typeof values] ?? "");
};
test("管理設定の基本項目を正規化する", () => { assert.equal(parse().bet_unit, 100); });
for (const [name, value] of [["grant_g", "1.5"], ["bet_unit", "0"], ["seed_pool_s", "-1"], ["takeout_d", "1"], ["w_time_floor", "NaN"], ["w_time_exp", "4.1"]] as const) {
  test(`管理設定の不正値を拒否する: ${name}`, () => assert.throws(() => parse({ [name]: value })));
}
test("管理設定の不正な締切日時を拒否する", () => assert.throws(() => parse({ closes_at: "not-a-date" })));
