/** 出走のウマ娘名と出走者。名簿の `name` は互換用の結合文字 */

export type HorseNames = {
  umaName: string;
  runnerName: string;
};

/** 旧「ウマ娘（出走者）」を分ける。括弧が無ければウマ娘名のみ */
export function parseHorseName(combined: string): HorseNames {
  const s = combined.trim();
  const m = s.match(/^(.*)（([^（）]+)）$/);
  if (m && m[1].trim()) {
    return { umaName: m[1].trim(), runnerName: m[2].trim() };
  }
  return { umaName: s, runnerName: "" };
}

export function composeHorseName(umaName: string, runnerName: string): string {
  const uma = umaName.trim();
  const runner = runnerName.trim();
  if (!uma) return "";
  if (!runner) return uma;
  return `${uma}（${runner}）`;
}

export function horseSheetParts(row: {
  name: string;
  uma_name?: string | null;
  runner_name?: string | null;
}): HorseNames {
  const uma = (row.uma_name ?? "").trim();
  const runner = (row.runner_name ?? "").trim();
  if (uma) return { umaName: uma, runnerName: runner };
  return parseHorseName(row.name);
}
