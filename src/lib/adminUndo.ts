/** Undo は明示的に許可した環境だけで有効にする。本番の既定は無効。 */
export function adminUndoAllowed(env: Pick<Env, "ALLOW_ADMIN_UNDO">): boolean {
  return env.ALLOW_ADMIN_UNDO === "1";
}
