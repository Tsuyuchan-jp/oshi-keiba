import { env } from "cloudflare:workers";
import { SELF } from "cloudflare:test";
import { encodeSession } from "../../src/lib/auth";

export const TEST_ADMIN_PASSWORD = "worker-test-admin-password";
export const TEST_ADMIN_USER_ID = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";
export const TEST_MEMBER_PASSWORD = "worker-test-member-password";
export const TEST_SESSION_SECRET = "worker-test-session-secret-with-sufficient-length";

export function cookiePair(response: Response): string {
  const value = response.headers.get("Set-Cookie");
  if (!value) throw new Error("Set-Cookie がありません");
  return value.split(";", 1)[0];
}

export async function workerFetch(
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("Cookie", cookie);
  return SELF.fetch(new Request(`https://worker.test${path}`, {
    redirect: "manual",
    ...init,
    headers,
  }));
}

export async function postForm(
  path: string,
  values: Record<string, string> = {},
  cookie?: string,
): Promise<Response> {
  const encoded = new URLSearchParams(values).toString();
  return workerFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encoded || "_test=",
  }, cookie);
}

export async function registerMember(
  displayName = "テストメンバー",
): Promise<{ cookie: string; response: Response }> {
  const response = await postForm("/login", {
    mode: "register",
    display_name: displayName,
    password: TEST_MEMBER_PASSWORD,
  });
  return { cookie: cookiePair(response), response };
}

export async function loginAdmin(): Promise<{ cookie: string; response: Response }> {
  const response = await postForm("/admin/login", {
    password: TEST_ADMIN_PASSWORD,
  });
  return { cookie: cookiePair(response), response };
}

export async function insertUser(opts: {
  id?: string;
  displayName?: string;
  role?: "member" | "admin";
  deletedAt?: number | null;
} = {}): Promise<string> {
  const id = opts.id ?? crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO users (id, display_name, role, balance, created_at, deleted_at) VALUES (?, ?, ?, 0, ?, ?)",
  ).bind(
    id,
    opts.displayName ?? `利用者-${id.slice(0, 8)}`,
    opts.role ?? "member",
    Date.now(),
    opts.deletedAt ?? null,
  ).run();
  return id;
}

export async function signedCookie(
  userId: string,
  role: "member" | "admin",
  exp = Date.now() + 60_000,
): Promise<string> {
  const token = await encodeSession({ userId, role, exp }, TEST_SESSION_SECRET);
  return `oshi_session=${encodeURIComponent(token)}`;
}
