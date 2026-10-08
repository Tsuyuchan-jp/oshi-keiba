import { parseJstInput } from "./ui.ts";

export type AdminParamsInput = {
  title: string;
  grant_g: number;
  bet_unit: number;
  /** 空欄は変更しない。出走登録中は必須 */
  seed_pool_s: number | null;
  takeout_d: number | null;
  voting_closes_at: number | null;
};

/** 投票中に締切を動かす場合だけ、誤って即時締切にしないよう確認する。 */
export function assertVotingCloseIsFuture(
  status: "setup" | "voting" | "closed" | "published",
  votingClosesAt: number | null,
  now = Date.now(),
): void {
  if (status === "voting" && votingClosesAt != null && votingClosesAt <= now) {
    throw new Error("投票中の締切は現在より後の日時を指定してください");
  }
}

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

function optionalNumber(
  get: (name: string) => string,
  name: string,
  min: number,
  max: number,
  required: boolean,
): number | null {
  const raw = get(name).trim();
  if (!raw) {
    if (required) throw new Error(`${name} を入力してください`);
    return null;
  }
  return numberInRange(get, name, min, max);
}

/** 管理設定POSTの基本項目をサーバー側で検証して正規化する。 */
export function adminParamsFromForm(
  get: (name: string) => string,
  opts: { requireSeed?: boolean } = {},
): AdminParamsInput {
  const title = get("title").trim();
  if (!title) throw new Error("イベント名を入力してください");
  const closesRaw = get("closes_at").trim();
  const voting_closes_at = parseJstInput(closesRaw);
  if (closesRaw && voting_closes_at == null) throw new Error("締切日時の形式が正しくありません");
  const requireSeed = opts.requireSeed !== false;
  return {
    title,
    grant_g: integerAtLeast(get, "grant_g", 0),
    bet_unit: integerAtLeast(get, "bet_unit", 1),
    seed_pool_s: optionalNumber(get, "seed_pool_s", 0, Number.MAX_VALUE, requireSeed),
    takeout_d: optionalNumber(get, "takeout_d", 0, 0.99, requireSeed),
    voting_closes_at,
  };
}
