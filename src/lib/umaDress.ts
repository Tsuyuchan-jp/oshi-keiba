import catalogJson from "../data/uma-dress-catalog.json" with { type: "json" };

export type UmaDress = { charaId: number; dressId: number; charaName: string; dressName: string; fullName: string };
const dresses = catalogJson.dresses as UmaDress[];

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/[\s\u3000\[\]【】]/g, "").toLowerCase();
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = saved;
    }
  }
  return prev[b.length]!;
}

function uniqueFuzzy(rows: readonly UmaDress[], label: string, field: "charaName" | "dressName"): UmaDress[] {
  const exact = rows.filter((row) => normalize(row[field]) === label);
  if (exact.length) return exact;
  const ranked = rows.map((row) => ({ row, distance: editDistance(normalize(row[field]), label) }))
    .filter((entry) => entry.distance <= Math.max(1, Math.floor(label.length * 0.15)))
    .sort((a, b) => a.distance - b.distance);
  if (!ranked.length || (ranked[1] && ranked[1].distance === ranked[0]!.distance)) return [];
  return [ranked[0]!.row];
}

/** ID が完全に収録済みの 0010 デフォルメ画像を持つ場合だけ URL を返す。 */
export function resolvePetitImageUrl(charaId: unknown, dressId: unknown): string | null {
  const chara = Number(charaId);
  const dress = Number(dressId);
  if (!Number.isSafeInteger(chara) || !Number.isSafeInteger(dress) || chara <= 0 || dress <= 0) return null;
  return dresses.some((row) => row.charaId === chara && row.dressId === dress)
    ? `/images/umamusume/petit/petit_${chara}_${dress}_0010.png`
    : null;
}

/** OCR のウマ娘名・衣装名を個別に一意なファジー照合で確定する。 */
export function resolveUmaDress(charaName: string, dressName: string): UmaDress | null {
  const chara = normalize(charaName);
  const dress = normalize(dressName);
  if (!chara || !dress) return null;
  const charaHits = uniqueFuzzy(dresses, chara, "charaName");
  const hits = uniqueFuzzy(charaHits, dress, "dressName");
  return hits.length === 1 ? hits[0]! : null;
}

/** 保存済み ID から衣装名を戻す。編集画面の初期表示用。 */
export function findUmaDress(charaId: unknown, dressId: unknown): UmaDress | null {
  const chara = Number(charaId);
  const dress = Number(dressId);
  return dresses.find((row) => row.charaId === chara && row.dressId === dress) ?? null;
}

export function umaDressCatalogJsonForPage(): string { return JSON.stringify(dresses); }
