import catalogJson from "../data/skill-catalog.json";

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

const byName = new Map(
  (catalogJson.skills as { name: string; kind: string }[]).map((s) => [s.name, s.kind]),
);

export function skillKindJa(kind: SkillKind): string {
  return KIND_JA[kind] ?? KIND_JA.unknown;
}

export function classifySkillName(raw: string): { name: string; kind: SkillKind } {
  const name = raw.trim();
  const kind = (byName.get(name) as SkillKind | undefined) ?? "unknown";
  return { name, kind };
}

export function catalogJsonForPage(): string {
  return JSON.stringify(catalogJson);
}
