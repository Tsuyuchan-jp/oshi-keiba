/**
 * 号外の差し込み。1着が無いときはプレースホルダ。
 */
import { overlayBySlogan, overlayColumns, GOUGAI_DEFAULT_SLOGAN } from "./gougaiOverlay.ts";
import { GOUGAI_DEFAULT_SUBTITLE, gougaiSubtitleUrl } from "./gougaiSubtitles.ts";
import { charaStandUrl, defaultCharaStandUrl } from "./gougaiStand.ts";
import { paddockView, type PaddockView } from "./paddockView.ts";
import type { Board, HorseBoard } from "./storeTypes.ts";
import { resolvePetitImageUrl } from "./umaDress.ts";

export const GOUGAI_DEFAULT_MASTHEAD = "月刊つゅインクル　号外";

const PLACEHOLDER = {
  umaName: "スペシャルウィーク",
  runnerName: "プレビュー太郎",
  charaId: 1001,
  dressId: 100101,
} as const;

export type GougaiFacts = {
  course: string;
  cond: string;
};

export type GougaiSheet = {
  hasWinner: boolean;
  masthead: string;
  eventTitle: string;
  umaName: string;
  runnerName: string;
  overlayMid: string;
  overlayLeft: string;
  overlaySlogan: string;
  subtitleFile: string;
  subtitleUrl: string;
  standUrl: string | null;
  standFallbackUrl: string | null;
  petitUrl: string | null;
  trainerIconUrl: string | null;
  bodyHtml: string;
  facts: GougaiFacts;
  fileBase: string;
  headCount: number;
};

function surfaceShort(label: string): string {
  return label === "芝" ? "芝" : "ダ";
}

export function gougaiFacts(race: PaddockView["race"], headCount: number): GougaiFacts {
  if (!race) return { course: "—", cond: "—" };
  return {
    course: `${race.courseName}　${surfaceShort(race.surface)}${race.distance}m`,
    cond: `${race.season}・${race.weather}・${race.groundCondition}　｜　${headCount}頭`,
  };
}

/** ファイル名用。日付は JST。 */
export function gougaiFileBase(title: string, now = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const safe = title.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim() || "開催";
  return `${ymd}-${safe}-号外`;
}

export function gougaiBodyHtml(eventTitle: string, umaName: string, runnerName: string): string {
  const lead = (text: string) => `<span class="lead">${escapeBody(text)}</span>`;
  return `${lead(eventTitle)}本戦！並みいる猛者を退け勝ったのは${lead(umaName)}！${lead(`「${runnerName}」`)}との信頼が生んだ最高の結末だ。優勝に相応しい、素晴らしい走りを見せてくれた。こんな走りを見られたことに、ただただ感謝したい。`;
}

function escapeBody(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function winnerOf(board: Board): HorseBoard | null {
  return board.horses.find((h) => h.horse.scratched === 0 && h.horse.finish_place === 1) ?? null;
}

export function gougaiView(board: Board): GougaiSheet {
  const race = paddockView(board).race;
  const active = board.horses.filter((h) => h.horse.scratched === 0);
  const winner = winnerOf(board);
  const hasWinner = winner != null;
  const umaName = hasWinner ? winner.horse.uma_name : PLACEHOLDER.umaName;
  const runnerName = hasWinner ? winner.horse.runner_name : PLACEHOLDER.runnerName;
  const charaId = hasWinner ? winner.horse.chara_id : PLACEHOLDER.charaId;
  const dressId = hasWinner ? winner.horse.dress_id : PLACEHOLDER.dressId;
  const overlay = overlayBySlogan(GOUGAI_DEFAULT_SLOGAN);
  const cols = overlayColumns(overlay, umaName);
  const standUrl = charaStandUrl(charaId, dressId);
  const standFallbackUrl = defaultCharaStandUrl(charaId, dressId);
  return {
    hasWinner,
    masthead: GOUGAI_DEFAULT_MASTHEAD,
    eventTitle: board.event.title,
    umaName,
    runnerName,
    overlayMid: cols.mid,
    overlayLeft: cols.left,
    overlaySlogan: overlay.slogan,
    subtitleFile: GOUGAI_DEFAULT_SUBTITLE,
    subtitleUrl: gougaiSubtitleUrl(GOUGAI_DEFAULT_SUBTITLE),
    standUrl,
    standFallbackUrl,
    petitUrl: resolvePetitImageUrl(charaId, dressId),
    trainerIconUrl: hasWinner && winner.horse.trainer_icon_key
      ? `/admin/trainer-icon/${encodeURIComponent(winner.horse.id)}?v=${encodeURIComponent(winner.horse.trainer_icon_key)}`
      : null,
    bodyHtml: gougaiBodyHtml(board.event.title, umaName, runnerName),
    facts: gougaiFacts(race, active.length),
    fileBase: gougaiFileBase(board.event.title),
    headCount: active.length,
  };
}
