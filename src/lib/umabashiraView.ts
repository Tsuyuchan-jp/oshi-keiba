/**
 * ウマ柱の差し込み。集約は paddockView / scoreFromHorse を読む。
 * 新しい評価式は足さない。
 */
import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { paddockHorseView, paddockView, type PaddockView } from "./paddockView.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";
import type { Board } from "./storeTypes.ts";
import { MARK_NONE, marksForHorses } from "./umabashiraMarks.ts";

export type UmabashiraAptLine = {
  text: string;
  highlight: boolean;
};

export type UmabashiraHorseView = {
  number: number;
  umaName: string;
  runnerName: string;
  /** 脚質なしは null → 紙面は — */
  styleLabel: string | null;
  petitUrl: string | null;
  strength: number | null;
  mark: string;
  /** setup・欠けは null → 紙面は ─ */
  odds: number | null;
  stats: [number, number, number, number, number] | null;
  apt: UmabashiraAptLine[] | null;
  sp: { base: number; effective: number; white: number; gold: number } | null;
};

export type UmabashiraSheet = {
  title: string;
  courseLine: string;
  fileBase: string;
  horses: UmabashiraHorseView[];
};

const DISTANCE_SHORT: Record<string, string> = {
  短距離: "短",
  マイル: "マ",
  中距離: "中",
  長距離: "長",
};

const STYLE_SHORT: Record<string, string> = {
  逃げ: "逃",
  先行: "先",
  差し: "差",
  追込: "追",
};

function finiteOrNull(n: number | null | undefined): number | null {
  return n != null && Number.isFinite(n) ? n : null;
}

function surfaceShort(label: string): string {
  if (label === "ダート") return "ダ";
  return label;
}

export function umabashiraCourseLine(race: PaddockView["race"], headCount: number): string {
  if (!race) return "—";
  const surface = race.surface === "芝" ? "芝" : "ダ";
  return `${race.courseName}　${surface}${race.distance}m　${race.season}・${race.weather}・${race.groundCondition}　｜　${headCount}頭`;
}

/** ファイル名用。日付は JST。 */
export function umabashiraFileBase(title: string, now = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const safe = title.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim() || "開催";
  return `${ymd}-${safe}-ウマ柱`;
}

function aptLines(paddock: ReturnType<typeof paddockHorseView>): UmabashiraAptLine[] | null {
  const apt = paddock.aptitudes;
  if (!apt) return null;
  const items = [
    `${surfaceShort(apt.surface.label)}${apt.surface.rank}`,
    `${DISTANCE_SHORT[apt.distance.label] ?? apt.distance.label}${apt.distance.rank}`,
    `${STYLE_SHORT[apt.style.label] ?? apt.style.label}${apt.style.rank}`,
  ];
  return items.map((text) => ({ text, highlight: text.endsWith("S") }));
}

export function umabashiraView(
  board: Board,
  strategicSkills?: readonly StrategicSkillRow[] | null,
): UmabashiraSheet {
  const race = paddockView(board, strategicSkills).race;
  const active = board.horses.filter((h) => h.horse.scratched === 0);
  const drafted = active.map((h) => {
    const input = parseHorseScoreInput(h.horse.score_input);
    const pv = paddockHorseView(h, board, strategicSkills);
    const stats = input
      ? ([
          input.stats.speed,
          input.stats.stamina,
          input.stats.power,
          input.stats.guts,
          input.stats.wisdom,
        ] as [number, number, number, number, number])
      : null;
    const summary = pv.skillSummary;
    const sp =
      pv.skillPower != null && summary
        ? {
            base: Math.round(pv.skillPower),
            effective: summary.effective,
            white: Math.max(0, summary.effective - summary.goldLike),
            gold: summary.goldLike,
          }
        : null;
    return {
      number: h.number,
      umaName: h.horse.uma_name,
      runnerName: h.horse.runner_name,
      styleLabel: input?.styleKey ? pv.styleLabel : null,
      petitUrl: pv.detailImageUrl,
      strength: finiteOrNull(h.horse.strength),
      odds: board.event.status === "setup" ? null : finiteOrNull(h.referenceOdds),
      stats,
      apt: aptLines(pv),
      sp,
    };
  });
  const marks = marksForHorses(drafted);
  return {
    title: board.event.title,
    courseLine: umabashiraCourseLine(race, drafted.length),
    fileBase: umabashiraFileBase(board.event.title),
    horses: drafted.map((h, i) => ({ ...h, mark: marks[i] ?? MARK_NONE })),
  };
}
