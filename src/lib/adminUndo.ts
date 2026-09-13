import { ADMIN_UNDO_CAPTURE_ENABLED } from "./undo";

/** 緊急停止フラグと環境設定の両方が有効な場合だけUndoを許可する。 */
export function adminUndoAllowed(env: Pick<Env, "ALLOW_ADMIN_UNDO">): boolean {
  return ADMIN_UNDO_CAPTURE_ENABLED && env.ALLOW_ADMIN_UNDO === "1";
}
