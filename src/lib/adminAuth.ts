import type { Session } from "./auth";
import type { UserRow } from "./storeTypes";

/**
 * 管理操作は、署名済みセッションだけでなく、設定済みの不変IDと DB の権限も照合する。
 * 表示名はこの判定に使わない。
 */
export function isConfiguredAdmin(
  session: Session | null,
  user: UserRow | null,
  adminUserId: string,
): boolean {
  return Boolean(adminUserId)
    && session?.role === "admin"
    && session.userId === adminUserId
    && user?.id === adminUserId
    && user.role === "admin";
}
