/**
 * store 会員（登録・参加・削除）
 */

import { newId } from "./auth";
import { getUser } from "./storeRead";
import type { EventRow, UserRow } from "./storeTypes";

export async function upsertUser(
  db: D1Database,
  displayName: string,
  role: "member" | "admin",
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  if (name.length > 40) throw new Error("表示名が長すぎます");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ?")
    .bind(name)
    .first<UserRow>();
  if (existing) return existing;
  const user: UserRow = {
    id: newId(),
    display_name: name,
    role,
    balance: 0,
    deleted_at: null,
  };
  await db
    .prepare(
      "INSERT INTO users (id, display_name, role, balance, created_at) VALUES (?, ?, ?, 0, ?)",
    )
    .bind(user.id, user.display_name, role, Date.now())
    .run();
  return user;
}

/** 初めて入室: 同名の利用停止メンバーは復帰。G は開催参加時 */
export async function registerMember(
  db: D1Database,
  displayName: string,
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  if (name.length > 40) throw new Error("表示名が長すぎます");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ?")
    .bind(name)
    .first<UserRow>();
  if (existing?.role === "member" && existing.deleted_at != null) {
    await db
      .prepare("UPDATE users SET deleted_at = NULL WHERE id = ?")
      .bind(existing.id)
      .run();
    return (await getUser(db, existing.id))!;
  }
  if (existing) throw new Error("この名前はすでに使われています");
  return upsertUser(db, name, "member");
}

/** 登録済み再入室: 名前なしは拒否。G は開催参加時 */
export async function loginMember(
  db: D1Database,
  displayName: string,
): Promise<UserRow> {
  const name = displayName.trim();
  if (!name) throw new Error("表示名を入れてください");
  const existing = await db
    .prepare("SELECT * FROM users WHERE display_name = ? AND role = 'member' AND deleted_at IS NULL")
    .bind(name)
    .first<UserRow>();
  if (!existing) throw new Error("この名前は登録されていません");
  return existing;
}

export async function grantIfNeeded(
  db: D1Database,
  event: EventRow,
  user: UserRow,
): Promise<UserRow> {
  const already = await db
    .prepare("SELECT amount FROM grants WHERE event_id = ? AND user_id = ?")
    .bind(event.id, user.id)
    .first<{ amount: number }>();
  if (already) return user;
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        "INSERT INTO grants (event_id, user_id, amount, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(event.id, user.id, event.grant_g, now),
    db
      .prepare("UPDATE users SET balance = balance + ? WHERE id = ?")
      .bind(event.grant_g, user.id),
  ]);
  return (await getUser(db, user.id))!;
}

/** 投票中の初回参加。G を1回だけ足す */
export async function joinEvent(
  db: D1Database,
  event: EventRow,
  user: UserRow,
): Promise<UserRow> {
  if (user.role !== "member" || user.deleted_at != null) {
    throw new Error("利用中のメンバーだけ参加できます");
  }
  if (event.status !== "voting") {
    throw new Error("参加できるのは投票中だけです");
  }
  return grantIfNeeded(db, event, user);
}

/** メンバーを利用停止にする。過去の開催記録と口座は残す */
export async function deleteMember(
  db: D1Database,
  userId: string,
): Promise<string> {
  const user = await getUser(db, userId);
  if (!user || user.role !== "member" || user.deleted_at != null) {
    throw new Error("削除できるメンバーが見つかりません");
  }
  await db
    .prepare("UPDATE users SET deleted_at = ? WHERE id = ? AND role = 'member' AND deleted_at IS NULL")
    .bind(Date.now(), userId)
    .run();
  return user.display_name;
}
