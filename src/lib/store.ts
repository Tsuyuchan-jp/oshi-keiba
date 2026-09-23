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
  EventSettlementRow,
  TreasuryDashboard,
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

export {
  listPreRaceAssessments,
  savePreRaceAssessments,
  getPreRaceAssessmentSnapshot,
  parsePreRaceAssessmentSnapshot,
} from "./preRaceAssessment";
export type { PreRaceAssessment, PreRaceAssessmentInput, PreRaceAssessmentSnapshot } from "./preRaceAssessment";

export { buildBoard, loadBoard, numberByHorseId } from "./storeBoard";

export { loadTreasuryDashboard } from "./storeTreasury";

export {
  captureAnalysisSnapshot,
  captureAnalysisSnapshotSafely,
  listAnalysisEvents,
  listAnalysisSnapshots,
  listAnalysisFailures,
  getAnalysisLogState,
  listAnalysisArchives,
  archiveAnalysisIfNeeded,
  clearAnalysisLogForEvent,
  analysisExportZip,
  analysisArchiveZip,
  analysisExportFilename,
} from "./analysisLog";
export type { AnalysisLogState, AnalysisArchiveRow } from "./analysisLog";

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
  updateHorseNumbers,
  dropHorse,
  setHorseShotKey,
  seedDemoHorses,
  clearHorses,
} from "./storeHorses";

export {
  openVoting,
  votingStartProblems,
  forceClose,
  placeBet,
  redoMyBets,
  scratchHorse,
  savePlaces,
  publishResults,
  revertVotingToSetup,
} from "./storeRace";
