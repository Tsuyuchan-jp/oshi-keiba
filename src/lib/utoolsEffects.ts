/**
 * U-tools コース×脚質の有効スキル（ranked）から id だけ取る。
 * バ身・相対化は使わない。白∩共通フィルタもしない（金も評価点に必要）。
 */
export const EFFECT_STYLE_KEYS = [
  "runner",
  "leader",
  "betweener",
  "chaser",
] as const;

export type EffectStyleKey = (typeof EFFECT_STYLE_KEYS)[number];

export type EffectiveSkillIdsByStyle = Record<EffectStyleKey, number[]>;

const UTOOLS_ORIGIN = "https://xn--gck1f423k.xn--1bvt37a.tools";

/** 日本語／略称 → U-tools ファイル名 */
const STYLE_ALIASES: Record<string, EffectStyleKey> = {
  runner: "runner",
  leader: "leader",
  betweener: "betweener",
  chaser: "chaser",
  逃: "runner",
  逃げ: "runner",
  先: "leader",
  先行: "leader",
  差: "betweener",
  差し: "betweener",
  追: "chaser",
  追込: "chaser",
};

export function resolveEffectStyleKey(raw: string): EffectStyleKey | null {
  const k = String(raw).trim();
  return STYLE_ALIASES[k] ?? null;
}

export function utoolsEffectsUrl(courseId: string | number, style: EffectStyleKey): string {
  return `${UTOOLS_ORIGIN}/race/courses/${courseId}/effects/${style}`;
}

/** RSC チャンクを結合（inherit の decodeRscChunks と同型） */
export function decodeRscChunks(html: string): string {
  const rscChunks = [
    ...html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g),
  ];
  return rscChunks
    .map(([, c]) =>
      c.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\"),
    )
    .join("");
}

function sliceBeforeEffect(text: string, effectIdx: number): string {
  const start = Math.max(0, effectIdx - 8000);
  return text.slice(start, effectIdx);
}

/**
 * expectedEffect 付きスキル id を出現順（重複除去）で返す。
 * ソートはしない（評価点は集合だけ使う）。
 */
export function parseRankedSkillIdsFromHtml(html: string): number[] {
  const joined = decodeRscChunks(html);
  const ids: number[] = [];
  const seen = new Set<number>();
  const re = /"expectedEffect":([0-9.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(joined))) {
    const slice = sliceBeforeEffect(joined, m.index);
    const idM = [...slice.matchAll(/"id":(\d+)/g)].at(-1);
    if (!idM) continue;
    const id = Number(idM[1]);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export type FetchEffectsOptions = {
  fetchImpl?: typeof fetch;
  /** 脚質間の待ち（ms）。既定 0（並列） */
  delayMs?: number;
};

async function fetchStyleIds(
  courseKey: string,
  style: EffectStyleKey,
  fetchImpl: typeof fetch,
): Promise<number[]> {
  const url = utoolsEffectsUrl(courseKey, style);
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`U-tools 取得失敗: ${courseKey}/${style} (HTTP ${res.status})`);
  }
  const html = await res.text();
  const ids = parseRankedSkillIdsFromHtml(html);
  if (ids.length === 0) {
    throw new Error(`U-tools 有効スキルが空です: ${courseKey}/${style}`);
  }
  return ids;
}

/** 1コース×4脚質の有効スキル id を取得する */
export async function fetchEffectiveSkillIdsForCourse(
  courseKey: string,
  opts: FetchEffectsOptions = {},
): Promise<EffectiveSkillIdsByStyle> {
  const key = String(courseKey).trim();
  if (!/^\d+$/.test(key)) {
    throw new Error(`courseKey が不正です: ${courseKey}`);
  }
  const fetchImpl = opts.fetchImpl ?? fetch;
  const delayMs = opts.delayMs ?? 0;

  if (delayMs <= 0) {
    const entries = await Promise.all(
      EFFECT_STYLE_KEYS.map(async (style) => {
        const ids = await fetchStyleIds(key, style, fetchImpl);
        return [style, ids] as const;
      }),
    );
    return Object.fromEntries(entries) as EffectiveSkillIdsByStyle;
  }

  const out = {} as EffectiveSkillIdsByStyle;
  for (let i = 0; i < EFFECT_STYLE_KEYS.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    const style = EFFECT_STYLE_KEYS[i]!;
    out[style] = await fetchStyleIds(key, style, fetchImpl);
  }
  return out;
}

export function parseEffectiveSkillIdsByStyle(
  raw: unknown,
): EffectiveSkillIdsByStyle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out = {} as EffectiveSkillIdsByStyle;
  for (const style of EFFECT_STYLE_KEYS) {
    const arr = o[style];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const ids: number[] = [];
    for (const x of arr) {
      const n = Number(x);
      if (!Number.isInteger(n) || n <= 0) return null;
      ids.push(n);
    }
    out[style] = ids;
  }
  return out;
}
