/**
 * 緑スキル condition 文字列の判定。
 * 文法は mdb どおり: `@` が OR、`&` が AND（AND の方が強い）。
 * 例: ground_type==2&ground_condition==3@ground_type==2&ground_condition==4
 */

export type GreenEvalContext = {
  /** 開催・コース（手打ち） */
  trackId?: number;
  rotation?: number;
  groundType?: number;
  distanceType?: number;
  courseDistance?: number;
  weather?: number;
  groundCondition?: number;
  season?: number;
  isBasisDistance?: number;
  cornerCount?: number;
  isTightTrack?: number;
  isDirtgrade?: number;
  time?: number;
  grade?: number;
  /** 頭（脚質は人手。ステは OCR） */
  runningStyle?: number;
  baseSpeed?: number;
  baseStamina?: number;
  basePower?: number;
  baseGuts?: number;
  baseWiz?: number;
  /** 任意。無ければその条件は不成立 */
  motivation?: number;
  popularity?: number;
  postNumber?: number;
  ownedSkillIds?: ReadonlySet<number>;
  ownedCharaIds?: ReadonlySet<number>;
};

const CTX_KEY: Record<string, keyof GreenEvalContext> = {
  track_id: "trackId",
  rotation: "rotation",
  ground_type: "groundType",
  distance_type: "distanceType",
  course_distance: "courseDistance",
  weather: "weather",
  ground_condition: "groundCondition",
  season: "season",
  is_basis_distance: "isBasisDistance",
  corner_count: "cornerCount",
  is_tight_track: "isTightTrack",
  is_dirtgrade: "isDirtgrade",
  time: "time",
  grade: "grade",
  running_style: "runningStyle",
  base_speed: "baseSpeed",
  base_stamina: "baseStamina",
  base_power: "basePower",
  base_guts: "baseGuts",
  base_wiz: "baseWiz",
  motivation: "motivation",
  popularity: "popularity",
  post_number: "postNumber",
};

const CLAUSE_RE = /^([a-z_]+)(==|!=|>=|<=|<|>)(-?\d+)$/;

function resolveValue(key: string, ctx: GreenEvalContext): number | undefined {
  if (key === "always") return 1;
  const field = CTX_KEY[key];
  if (!field) return undefined;
  const v = ctx[field];
  return typeof v === "number" ? v : undefined;
}

/** 1 節（例: rotation==1）。文脈に無いキーは不成立。 */
export function evalGreenClause(clause: string, ctx: GreenEvalContext): boolean {
  const raw = clause.trim();
  if (!raw) return true;

  if (raw.startsWith("is_exist_skill_id==")) {
    const id = Number(raw.slice("is_exist_skill_id==".length));
    return Number.isFinite(id) && !!ctx.ownedSkillIds?.has(id);
  }
  if (raw.startsWith("is_exist_chara_id==")) {
    const id = Number(raw.slice("is_exist_chara_id==".length));
    return Number.isFinite(id) && !!ctx.ownedCharaIds?.has(id);
  }

  // 場の人数・人気・抽選など、開催手打ちに含めないものは不成立
  if (
    raw.startsWith("random_lot") ||
    raw.startsWith("same_skill_horse_count") ||
    raw.startsWith("running_style_count_same") ||
    raw.startsWith("running_style_equal_popularity_one")
  ) {
    return false;
  }

  const m = raw.match(CLAUSE_RE);
  if (!m) return false;
  const [, key, op, rhsStr] = m;
  const rhs = Number(rhsStr);
  const lhs = resolveValue(key, ctx);
  if (lhs === undefined) return false;

  switch (op) {
    case "==":
      return lhs === rhs;
    case "!=":
      return lhs !== rhs;
    case ">=":
      return lhs >= rhs;
    case "<=":
      return lhs <= rhs;
    case ">":
      return lhs > rhs;
    case "<":
      return lhs < rhs;
    default:
      return false;
  }
}

/** mdb の condition_1 全体。 */
export function evalGreenCondition(condition: string, ctx: GreenEvalContext): boolean {
  const expr = condition.trim();
  if (!expr) return true;
  // OR で分け、各枝は AND
  const branches = expr.split("@");
  for (const branch of branches) {
    const clauses = branch.split("&");
    if (clauses.every((c) => evalGreenClause(c, ctx))) return true;
  }
  return false;
}
