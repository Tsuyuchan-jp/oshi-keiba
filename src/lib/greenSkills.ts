import greenJson from "../data/green-skills.json" with { type: "json" };
import { evalGreenCondition, type GreenEvalContext } from "./greenCondition.ts";

export type { GreenEvalContext };

export type GreenBonus = {
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wisdom: number;
};

export type GreenSkill = GreenBonus & {
  id: number;
  name: string;
  condition: string;
  minus: boolean;
};

const empty = (): GreenBonus => ({
  speed: 0,
  stamina: 0,
  power: 0,
  guts: 0,
  wisdom: 0,
});

const skills = greenJson.skills as GreenSkill[];
const byId = new Map(skills.map((s) => [s.id, s]));
const byName = new Map(skills.map((s) => [s.name, s]));

export function greenSkillById(id: number): GreenSkill | undefined {
  return byId.get(id);
}

export function greenSkillByName(raw: string): GreenSkill | undefined {
  return byName.get(raw.trim());
}

export function addGreenBonus(a: GreenBonus, b: GreenBonus): GreenBonus {
  return {
    speed: a.speed + b.speed,
    stamina: a.stamina + b.stamina,
    power: a.power + b.power,
    guts: a.guts + b.guts,
    wisdom: a.wisdom + b.wisdom,
  };
}

export type AppliedGreen = {
  name: string;
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wisdom: number;
};

/** 条件成立の緑を1枚ずつ返す（どのスキルがどのステか）。 */
export function listAppliedGreensByNames(
  names: string[],
  ctx: GreenEvalContext,
): AppliedGreen[] {
  const out: AppliedGreen[] = [];
  for (const name of names) {
    const g = greenSkillByName(name);
    if (!g) continue;
    if (!evalGreenCondition(g.condition, ctx)) continue;
    out.push({
      name: g.name,
      speed: g.speed,
      stamina: g.stamina,
      power: g.power,
      guts: g.guts,
      wisdom: g.wisdom,
    });
  }
  return out;
}

/** 開催条件＋脚質などで condition が立つ緑だけ足す。 */
export function sumGreenBonusesByNames(names: string[], ctx: GreenEvalContext): GreenBonus {
  return listAppliedGreensByNames(names, ctx).reduce(
    (acc, g) => addGreenBonus(acc, g),
    empty(),
  );
}
