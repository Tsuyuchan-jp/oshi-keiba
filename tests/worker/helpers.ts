import { env } from "cloudflare:workers";
import { SELF } from "cloudflare:test";
import { encodeSession } from "../../src/lib/auth";
import { addHorse, ensureEvent } from "../../src/lib/store";

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

export async function postMultipart(
  path: string,
  values: Record<string, string | Blob> = {},
  cookie?: string,
): Promise<Response> {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return workerFetch(path, { method: "POST", body: form }, cookie);
}

export function redirectMessage(response: Response): {
  location: string;
  message: string | null;
  error: boolean;
} {
  const location = response.headers.get("Location");
  if (!location) throw new Error("Location がありません");
  const url = new URL(location, "https://worker.test");
  return {
    location: url.pathname + url.search,
    message: url.searchParams.get("msg"),
    error: url.searchParams.get("err") === "1",
  };
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

export type ReadyRace = {
  eventId: string;
  horseIds: string[];
};

export const VALID_SCORE_SETUP = JSON.stringify({
  conditions: {
    courseKey: "10606",
    weather: 1,
    groundCondition: 1,
    season: 3,
  },
  requirements: {
    speedCap: 1200,
    staminaNoTempt: 600,
    staminaWithTempt: 800,
    staminaRace: false,
    power: 700,
    guts: 400,
    wisdom: 600,
    staminaByStyle: {
      runner: { noTempt: 600, withTempt: 800 },
      leader: { noTempt: 600, withTempt: 800 },
      betweener: { noTempt: 600, withTempt: 800 },
      chaser: { noTempt: 600, withTempt: 800 },
    },
  },
  staminaRaceSelected: true,
  staminaSurplusSelected: true,
});

export async function seedReadyRace(opts: {
  horseCount?: number;
  enabledKinds?: string;
  grant?: number;
  betUnit?: number;
  closesAt?: number;
} = {}): Promise<ReadyRace> {
  const event = await ensureEvent(env.DB);
  await env.DB.prepare(
    `UPDATE events SET title = ?, grant_g = ?, bet_unit = ?, enabled_kinds = ?,
       voting_closes_at = ?, score_setup = ? WHERE id = ?`,
  ).bind(
    "結合テスト杯",
    opts.grant ?? 3000,
    opts.betUnit ?? 100,
    opts.enabledKinds ?? "win,umaren,umatan,sanrenpuku,sanrentan",
    opts.closesAt ?? Date.now() + 3_600_000,
    VALID_SCORE_SETUP,
    event.id,
  ).run();

  const horseIds: string[] = [];
  for (let index = 0; index < (opts.horseCount ?? 3); index += 1) {
    horseIds.push(await addHorse(env.DB, event, `テストウマ${index + 1}`, `出走者${index + 1}`, {
      strength: 30 - index,
    }));
  }
  return { eventId: event.id, horseIds };
}

export async function openRace(adminCookie: string): Promise<Response> {
  return postForm("/admin/open", {}, adminCookie);
}

export async function joinRace(memberCookie: string): Promise<Response> {
  return postForm("/bet/join", { kind: "win" }, memberCookie);
}
