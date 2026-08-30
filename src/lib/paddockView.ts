import { parseHorseScoreInput } from "./horseScoreInput.ts";
import { scoreFromHorse } from "./scoreFromHorse.ts";
import { parseScoreSetup } from "./scoreSetup.ts";
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
  skillPower: number | null;
  skillSummary: { effective: number; goldLike: number; strategic: number } | null;
  stats: { speed: number; stamina: number; power: number; guts: number; wisdom: number } | null;
  aptitudes: { surface: string; distance: string; style: string } | null;
};

export type PaddockView = {
  eventId: string;
  title: string;
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

export function paddockHorseView(
  horse: HorseBoard,
  board: Pick<Board, "event">,
  strategicSkills?: readonly StrategicSkillRow[] | null,
): PaddockHorseView {
  const input = parseHorseScoreInput(horse.horse.score_input);
  const setup = parseScoreSetup(board.event.score_setup);
  const scored = scoreFromHorse(setup, input, strategicSkills);
  const style = input?.styleKey ?? null;
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
    skillPower: scored?.breakdown.skill.base ?? null,
    skillSummary: scored
      ? {
          effective: scored.breakdown.skill.effectiveCount,
          goldLike: scored.breakdown.skill.goldCount,
          strategic: scored.breakdown.skill.strategicPoints,
        }
      : null,
    stats: input?.stats ?? null,
    aptitudes: scored?.aptitudes ?? null,
  };
}

export function paddockView(
  board: Board,
  strategicSkills?: readonly StrategicSkillRow[] | null,
): PaddockView {
  return {
    eventId: board.event.id,
    title: board.event.title,
    horses: board.horses
      .filter((horse) => horse.horse.scratched === 0)
      .map((horse) => paddockHorseView(horse, board, strategicSkills)),
  };
}
