import catalogJson from "../data/skill-catalog.json" with { type: "json" };

export type SkillKind =
  | "green"
  | "gold"
  | "white"
  | "unique"
  | "evo"
  | "scenario"
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
  scenario: "シナリオ",
  minus: "デバフ",
  inherit: "継承",
  special: "特殊",
  unknown: "未分類",
};

type CatalogEntry = { name: string; kind: string; id?: number };

const skills = catalogJson.skills as CatalogEntry[];

/** 同名複数時は unique を優先（名前だけのフォールバック用。正は id） */
const byName = new Map<string, CatalogEntry>();
for (const s of skills) {
  const cur = byName.get(s.name);
  if (!cur || s.kind === "unique") byName.set(s.name, s);
}

const byId = new Map<number, CatalogEntry>();
for (const s of skills) {
  if (typeof s.id === "number" && Number.isFinite(s.id)) byId.set(s.id, s);
}

export function skillKindJa(kind: SkillKind): string {
  return KIND_JA[kind] ?? KIND_JA.unknown;
}

function entryToResult(
  nameFallback: string,
  hit: CatalogEntry | undefined,
): { name: string; kind: SkillKind; id: number | null } {
  const name = (hit?.name || nameFallback).trim();
  const kind = (hit?.kind as SkillKind | undefined) ?? "unknown";
  const id =
    hit && typeof hit.id === "number" && Number.isFinite(hit.id) ? hit.id : null;
  return { name, kind, id };
}

/** 名前のみ。同名は unique 優先（id 無し時のフォールバック） */
export function classifySkillName(raw: string): {
  name: string;
  kind: SkillKind;
  id: number | null;
} {
  const name = raw.trim();
  return entryToResult(name, byName.get(name));
}

/** id があればカタログ id 優先。無ければ名前（unique 優先） */
export function classifySkill(
  raw: string,
  id?: number | null,
): {
  name: string;
  kind: SkillKind;
  id: number | null;
} {
  const name = raw.trim();
  if (id != null && Number.isFinite(id)) {
    const by = byId.get(id);
    if (by) return entryToResult(name, by);
  }
  return classifySkillName(name);
}

export function catalogJsonForPage(): string {
  return JSON.stringify(catalogJson);
}
