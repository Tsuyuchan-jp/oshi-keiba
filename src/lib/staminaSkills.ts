import staminaJson from "../data/stamina-skills.json" with { type: "json" };

export type StaminaSkill = {
  id: number;
  name: string;
  /** master.mdb の 1/10000 単位。550 = 最大体力の 5.5%。 */
  recovery: number;
  staminaCost: number;
  /** 回復以外の効果も持つため、有効スキルのときだけ回復を採用する。 */
  compoundRecovery: boolean;
};

export type AppliedStaminaSkill = {
  id: number | null;
  name: string;
  rate: number;
};

export type StaminaSkillBreakdown = {
  recoveryRate: number;
  staminaCostRate: number;
  netRate: number;
  recoveries: AppliedStaminaSkill[];
  costs: AppliedStaminaSkill[];
};

const skills = staminaJson.skills as StaminaSkill[];
const byId = new Map(skills.map((skill) => [skill.id, skill]));
const byName = new Map<string, StaminaSkill>();
for (const skill of skills) {
  // ID が無い手編集データ用。数値順で先に来る通常版／固有版を優先する。
  if (!byName.has(skill.name)) byName.set(skill.name, skill);
}

export function staminaSkillById(id: number): StaminaSkill | undefined {
  return byId.get(id);
}

export function staminaSkillByName(name: string): StaminaSkill | undefined {
  return byName.get(name.trim());
}

export function staminaSkillFor(
  name: string,
  id?: number | null,
): StaminaSkill | undefined {
  return id != null ? byId.get(id) ?? byName.get(name.trim()) : byName.get(name.trim());
}

export function staminaSkillBreakdown(
  skillNames: readonly string[],
  skillIds: ReadonlyArray<number | null | undefined> | undefined,
  isEffective: (name: string, id: number | null) => boolean,
): StaminaSkillBreakdown {
  const recoveries: AppliedStaminaSkill[] = [];
  const costs: AppliedStaminaSkill[] = [];

  for (let index = 0; index < skillNames.length; index++) {
    const name = skillNames[index]!.trim();
    const id = skillIds?.[index] ?? null;
    const skill = staminaSkillFor(name, id);
    if (!skill) continue;
    const effective = isEffective(name, id);
    if (skill.recovery > 0 && (!skill.compoundRecovery || effective)) {
      recoveries.push({ id, name: skill.name, rate: skill.recovery / 10000 });
    }
    if (skill.staminaCost > 0 && effective) {
      costs.push({ id, name: skill.name, rate: skill.staminaCost / 10000 });
    }
  }

  const recoveryRate = recoveries.reduce((sum, skill) => sum + skill.rate, 0);
  const staminaCostRate = costs.reduce((sum, skill) => sum + skill.rate, 0);
  return {
    recoveryRate,
    staminaCostRate,
    netRate: recoveryRate - staminaCostRate,
    recoveries,
    costs,
  };
}

export function staminaSkillsJsonForPage(): string {
  return JSON.stringify(staminaJson);
}
