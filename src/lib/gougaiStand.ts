/**
 * 号外カバーの立ち絵 URL。ファイルは git に載せない。
 * 欠けは img の onerror で既定衣装 → petit → 頭文字へ落とす。
 */
import catalogJson from "../data/uma-dress-catalog.json" with { type: "json" };
import type { UmaDress } from "./umaDress.ts";

const dresses = catalogJson.dresses as UmaDress[];

function safeId(value: unknown): number | null {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** `chara/chr{id}/chara_stand_{chara}_{dress}` を静的パスにしたもの */
export function charaStandUrl(charaId: unknown, dressId: unknown): string | null {
  const chara = safeId(charaId);
  const dress = safeId(dressId);
  if (chara == null || dress == null) return null;
  return `/images/umamusume/stand/chara_stand_${chara}_${dress}.png`;
}

function defaultDressId(charaId: number): number {
  const rows = dresses.filter((row) => row.charaId === charaId);
  const expected = charaId * 100 + 1;
  return rows.find((row) => row.dressId === expected)?.dressId ?? rows[0]?.dressId ?? expected;
}

/** 同キャラの既定衣装 stand。出走衣装と同じなら null */
export function defaultCharaStandUrl(charaId: unknown, dressId: unknown): string | null {
  const chara = safeId(charaId);
  if (chara == null) return null;
  const fallbackDress = defaultDressId(chara);
  const dress = safeId(dressId);
  if (dress != null && fallbackDress === dress) return null;
  return charaStandUrl(chara, fallbackDress);
}
