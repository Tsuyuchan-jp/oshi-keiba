import catalogJson from "../data/skill-catalog.json" with { type: "json" };

export type SkillKind =
  | "green"
  | "gold"
  | "white"
  | "unique"
  | "evo"
  | "minus"
  | "inherit"
  | "special"
  | "unknown";

const KIND_JA: Record<SkillKind, string> = {
  green: "緑",
  gold: "金",
  white: "白",
  unique: "固有",
  evo: "進化",
  minus: "デバフ",
  inherit: "継承",
  special: "特殊",
  unknown: "未分類",
};

type CatalogEntry = { name: string; kind: string; id?: number };

const skills = catalogJson.skills as CatalogEntry[];

/** 同名複数時は unique を優先（表示・金判定。評価点の正は skillIds） */
const byName = new Map<string, CatalogEntry>();
for (const s of skills) {
  const cur = byName.get(s.name);
  if (!cur || s.kind === "unique") byName.set(s.name, s);
}

export function skillKindJa(kind: SkillKind): string {
  return KIND_JA[kind] ?? KIND_JA.unknown;
}

export function classifySkillName(raw: string): {
  name: string;
  kind: SkillKind;
  id: number | null;
} {
  const name = raw.trim();
  const hit = byName.get(name);
  const kind = (hit?.kind as SkillKind | undefined) ?? "unknown";
  const id =
    hit && typeof hit.id === "number" && Number.isFinite(hit.id) ? hit.id : null;
  return { name, kind, id };
}

export function catalogJsonForPage(): string {
  return JSON.stringify(catalogJson);
}
