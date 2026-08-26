/**
 * store 公開 API（分割モジュールの再エクスポート）
 */

export { clawbackBalance, joinButtonLabel } from "./lifecycle";
export type { EventScoreSetup } from "./storeEvent";

export type {
  EventStatus,
  EventRow,
  HorseRow,
  UserRow,
  BetRow,
  HorseBoard,
  PoolCombo,
  KindPool,
  Board,
  AddHorseOpts,
  UpdateHorseOpts,
} from "./storeTypes";

export { MAX_SHOT_BYTES } from "./storeTypes";

export { eventScoreSetup, getEventById, ensureEvent, maybeAutoClose, updateParams, openNextEvent, discardCurrentSetup, resetDemo } from "./storeEvent";

export {
  listHorses,
  listActiveBets,
  listAllBets,
  listMembers,
  getUser,
  hasJoinedEvent,
  listUserBets,
  listUserPayouts,
  listEventPayouts,
} from "./storeRead";

export { buildBoard, loadBoard, numberByHorseId } from "./storeBoard";

export {
  upsertUser,
  registerMember,
  loginMember,
  joinEvent,
  grantIfNeeded,
  deleteMember,
} from "./storeMembers";

export {
  addHorse,
  updateHorse,
  dropHorse,
  setHorseShotKey,
  seedDemoHorses,
  clearHorses,
} from "./storeHorses";

export {
  openVoting,
  forceClose,
  placeBet,
  redoMyBets,
  scratchHorse,
  savePlaces,
  publishResults,
  revertVotingToSetup,
} from "./storeRace";
