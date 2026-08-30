/**
 * store 共有型（行・ボード）。DB 操作は持たない。
 */

import type { BetKind } from "./bets";

export type EventStatus = "setup" | "voting" | "closed" | "published";

export type EventRow = {
  id: string;
  title: string;
  status: EventStatus;
  grant_g: number;
  bet_unit: number;
  seed_pool_s: number;
  pull_e: number;
  takeout_d: number;
  w_time_floor: number;
  w_time_exp: number;
  voting_opened_at: number | null;
  voting_closes_at: number | null;
  closed_at: number | null;
  published_at: number | null;
  payouts_applied: number;
  created_at: number;
  /** カンマ区切り。単勝は常に含む */
  enabled_kinds: string;
  /** 1 ならメンバー画面の開催 */
  is_current: number;
  /** 開催条件とステ目標値（JSON）。未設定は null */
  score_setup: string | null;
};

export type HorseRow = {
  id: string;
  event_id: string;
  name: string;
  uma_name: string;
  runner_name: string;
  shot_key: string | null;
  paddock_comment?: string | null;
  trainer_icon_key?: string | null;
  /** 育成ウマ娘・衣装。旧データや未確定 OCR は null。 */
  chara_id: number | null;
  dress_id: number | null;
  strength: number;
  /** 評価点材料 JSON。未設定は null */
  score_input: string | null;
  seed_source: string;
  scratched: number;
  finish_place: number | null;
  sort_order: number;
};

export type UserRow = {
  id: string;
  display_name: string;
  role: string;
  balance: number;
};

export type BetRow = {
  id: string;
  event_id: string;
  user_id: string;
  /** 旧単勝列。移行後も残るが読みは horse_1 優先 */
  horse_id: string;
  kind: BetKind;
  selection_key: string;
  horse_1: string;
  horse_2: string | null;
  horse_3: string | null;
  amount: number;
  refunded: number;
  created_at: number;
};

export type HorseBoard = {
  horse: HorseRow;
  /** 通し番号（1..n）。名簿の並び */
  number: number;
  real: number;
  imputed: number;
  seed: number;
  display: number;
  referenceOdds: number | null;
  confirmedOdds: number | null;
};

export type PoolCombo = {
  selection_key: string;
  horse_1: string;
  horse_2: string | null;
  horse_3: string | null;
  real: number;
  odds: number | null;
};

export type KindPool = {
  kind: BetKind;
  realTotal: number;
  combos: PoolCombo[];
  /** 着順があるとき。当たり実票ゼロなら特払い予定 */
  winningKey: string | null;
  voidSpecial: boolean | null;
};

export type Board = {
  event: EventRow;
  wTime: number;
  wVolume: number;
  w: number;
  /** 単勝実票合計 */
  realTotal: number;
  /** 連勝実票合計（返還済み除く） */
  exoticTotal: number;
  /** 単勝参考の TV（単勝 + λ×連勝） */
  tv: number;
  seedTotal: number;
  displayTotal: number;
  horses: HorseBoard[];
  pools: KindPool[];
};

export type AddHorseOpts = {
  strength: number;
  /** 評価点材料。無い頭は直置きのみ */
  scoreInputJson?: string | null;
  charaId?: number | null;
  dressId?: number | null;
  /** 未指定は manual（デモ投入など） */
  seedSource?: "auto" | "manual";
  recordUndo?: boolean;
};

export type UpdateHorseOpts = {
  strength: number;
  scoreInputJson?: string | null;
  charaId?: number | null;
  dressId?: number | null;
  seedSource?: "auto" | "manual";
  /** true なら score_input を触らない（Strength だけ直置き） */
  keepScoreInput?: boolean;
  recordUndo?: boolean;
  /** パドック用プロフィール。未指定なら既存値を保持する。 */
  paddockComment?: string | null;
  trainerIconKey?: string | null;
  shotKey?: string | null;
};

/** 試運転: 頭数 2〜18 */
export const MIN_LIVE_HORSES = 2;
export const MAX_LIVE_HORSES = 18;
export const MAX_SHOT_BYTES = 2_000_000;
