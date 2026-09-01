import { parseJstInput } from "./ui.ts";

export type AdminParamsInput = {
  title: string; grant_g: number; bet_unit: number; seed_pool_s: number;
  pull_e: number; takeout_d: number; w_time_floor: number; w_time_exp: number;
  voting_closes_at: number | null;
};

function numberField(get: (name: string) => string, name: string): number {
  const raw = get(name).trim();
  if (!raw) throw new Error(`${name} を入力してください`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} は数値で入力してください`);
  return value;
}
function integerAtLeast(get: (name: string) => string, name: string, min: number): number {
  const value = numberField(get, name);
  if (!Number.isInteger(value) || value < min) throw new Error(`${name} は ${min} 以上の整数で入力してください`);
  return value;
}
function numberInRange(get: (name: string) => string, name: string, min: number, max: number): number {
  const value = numberField(get, name);
  if (value < min || value > max) throw new Error(`${name} は ${min} 〜 ${max} の範囲で入力してください`);
  return value;
}

/** 管理設定POSTの基本項目をサーバー側で検証して正規化する。 */
export function adminParamsFromForm(get: (name: string) => string): AdminParamsInput {
  const title = get("title").trim();
  if (!title) throw new Error("イベント名を入力してください");
  const closesRaw = get("closes_at").trim();
  const voting_closes_at = parseJstInput(closesRaw);
  if (closesRaw && voting_closes_at == null) throw new Error("締切日時の形式が正しくありません");
  return {
    title, grant_g: integerAtLeast(get, "grant_g", 0), bet_unit: integerAtLeast(get, "bet_unit", 1),
    seed_pool_s: numberInRange(get, "seed_pool_s", 0, Number.MAX_VALUE),
    pull_e: numberInRange(get, "pull_e", 0, Number.MAX_VALUE),
    takeout_d: numberInRange(get, "takeout_d", 0, 0.99),
    w_time_floor: numberInRange(get, "w_time_floor", 0, 0.99),
    w_time_exp: numberInRange(get, "w_time_exp", 0.2, 4), voting_closes_at,
  };
}
