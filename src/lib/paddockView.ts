import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { scoreFromHorse } from "./scoreFromHorse.ts";
import {
  getScoreCourse,
  GROUND_CONDITION_OPTIONS,
  parseScoreSetup,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from "./scoreSetup.ts";
import { staminaRequirementsForStyle } from "./score.ts";
import type { StrategicSkillRow } from "./strategicSkills.ts";
import type { Board, HorseBoard } from "./storeTypes.ts";
import { resolvePetitImageUrl } from "./umaDress.ts";
import type { EffectStyleKey } from "./utoolsEffects.ts";

export type PaddockStyle = EffectStyleKey | null;

export type PaddockHorseView = {
  id: string;
  number: number;
  umaName: string;
  trainerName: string;
  odds: number | null;
  style: PaddockStyle;
  styleLabel: string;
  listImageUrl: string | null;
  detailImageUrl: string | null;
  shotKey: string | null;
  shotUrl: string | null;
  /** 次段階で管理者が入力する出走ごとの意気込み。 */
  comment: string | null;
  /** 次段階でトレーナー単位に登録する note アイコン。 */
  trainerIconUrl: string | null;
  statTargets: { speed: number; stamina: number; power: number; guts: number; wisdom: number } | null;
  skillPower: number | null;
  skillSummary: { effective: number; goldLike: number; strategic: number } | null;
  stats: { speed: number; stamina: number; power: number; guts: number; wisdom: number } | null;
  aptitudes: {
    surface: { label: string; rank: string };
    distance: { label: string; rank: string };
    style: { label: string; rank: string };
  } | null;
};

export type PaddockView = {
  eventId: string;
  title: string;
  race: {
    courseName: string;
    distance: number;
    surface: string;
    season: string;
    weather: string;
    groundCondition: string;
  } | null;
  horses: PaddockHorseView[];
};

const STYLE_LABELS: Record<EffectStyleKey, string> = {
  runner: "逃げ",
  leader: "先行",
  betweener: "差し",
  chaser: "追込",
};

function styleLabel(style: PaddockStyle): string {
  return style ? STYLE_LABELS[style] : "未設定";
}

function imageUrls(horse: HorseBoard): Pick<PaddockHorseView, "listImageUrl" | "detailImageUrl"> {
  const detailImageUrl = resolvePetitImageUrl(horse.horse.chara_id, horse.horse.dress_id);
  return {
    detailImageUrl,
    listImageUrl: detailImageUrl?.replace("_0010.png", "_0011.png") ?? null,
  };
}

function optionLabel(options: readonly { value: number; label: string }[], value: number): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}

function raceInfo(board: Pick<Board, "event">): PaddockView["race"] {
  const setup = parseScoreSetup(board.event.score_setup);
  const course = setup ? getScoreCourse(setup.conditions.courseKey) : null;
  if (!setup || !course) return null;
  return {
    courseName: course.place,
    distance: course.courseDistance,
    surface: course.groundType === 1 ? "芝" : "ダート",
    season: optionLabel(SEASON_OPTIONS, setup.conditions.season),
    weather: optionLabel(WEATHER_OPTIONS, setup.conditions.weather),
    groundCondition: optionLabel(GROUND_CONDITION_OPTIONS, setup.conditions.groundCondition),
  };
}

function distanceLabel(distanceType: number): string {
  return ({ 1: "短距離", 2: "マイル", 3: "中距離", 4: "長距離" })[distanceType] ?? "距離";
}

export function paddockHorseView(
  horse: HorseBoard,
  board: Pick<Board, "event">,
  strategicSkills?: readonly StrategicSkillRow[] | null,
): PaddockHorseView {
  const input = parseHorseScoreInput(horse.horse.score_input);
  const setup = parseScoreSetup(board.event.score_setup);
  const scored = scoreFromHorse(setup, input, strategicSkills);
  const style = input?.styleKey ?? null;
  const stamina = setup && style
    ? staminaRequirementsForStyle(setup.requirements, style).staminaNoTempt
    : null;
  const images = imageUrls(horse);
  return {
    id: horse.horse.id,
    number: horse.number,
    umaName: horse.horse.uma_name,
    trainerName: horse.horse.runner_name,
    odds: horse.referenceOdds,
    style,
    styleLabel: styleLabel(style),
    ...images,
    shotKey: horse.horse.shot_key,
    shotUrl: horse.horse.shot_key
      ? `/paddock/shot/${encodeURIComponent(horse.horse.id)}?v=${encodeURIComponent(horse.horse.shot_key)}`
      : null,
    comment: horse.horse.paddock_comment ?? null,
    trainerIconUrl: horse.horse.trainer_icon_key
      ? `/paddock/trainer-icon/${encodeURIComponent(horse.horse.id)}?v=${encodeURIComponent(horse.horse.trainer_icon_key)}`
      : null,
    statTargets: setup && stamina != null
      ? {
          speed: setup.requirements.speedCap,
          stamina,
          power: setup.requirements.power,
          guts: setup.requirements.guts,
          wisdom: setup.requirements.wisdom,
        }
      : null,
    skillPower: scored?.breakdown.skill.base ?? null,
    skillSummary: scored
      ? {
          effective: scored.breakdown.skill.effectiveCount,
          goldLike: scored.breakdown.skill.goldCount,
          strategic: scored.breakdown.skill.strategicPoints,
        }
      : null,
    stats: input?.stats ?? null,
    aptitudes: scored && setup
      ? (() => {
          const course = getScoreCourse(setup.conditions.courseKey);
          return course
            ? {
                surface: { label: course.groundType === 1 ? "芝" : "ダート", rank: scored.aptitudes.surface },
                distance: { label: distanceLabel(course.distanceType), rank: scored.aptitudes.distance },
                style: { label: styleLabel(style), rank: scored.aptitudes.style },
              }
            : null;
        })()
      : null,
  };
}

export function paddockView(
  board: Board,
  strategicSkills?: readonly StrategicSkillRow[] | null,
): PaddockView {
  return {
    eventId: board.event.id,
    title: board.event.title,
    race: raceInfo(board),
    horses: board.horses
      .filter((horse) => horse.horse.scratched === 0)
      .map((horse) => paddockHorseView(horse, board, strategicSkills)),
  };
}
