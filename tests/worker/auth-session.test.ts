import { env } from "cloudflare:workers";
import { describe, expect, test } from "vitest";
import {
  decodeSession,
  encodeSession,
  sessionCookie,
  type Session,
} from "../../src/lib/auth";
import {
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_USER_ID,
  TEST_MEMBER_PASSWORD,
  TEST_SESSION_SECRET,
  cookiePair,
  loginAdmin,
  postForm,
  registerMember,
  workerFetch,
} from "./helpers";

describe("署名付きセッション", () => {
  test("正しい署名だけを復号し、改ざん・期限切れ・不正roleを拒否する", async () => {
    const valid: Session = {
      userId: "member-1",
      role: "member",
      exp: Date.now() + 60_000,
    };
    const token = await encodeSession(valid, TEST_SESSION_SECRET);
    expect(await decodeSession(token, TEST_SESSION_SECRET)).toEqual(valid);
    expect(await decodeSession(`${token.slice(0, -1)}x`, TEST_SESSION_SECRET)).toBeNull();
    expect(await decodeSession(token, "different-secret")).toBeNull();

    const expired = await encodeSession({ ...valid, exp: Date.now() - 1 }, TEST_SESSION_SECRET);
    expect(await decodeSession(expired, TEST_SESSION_SECRET)).toBeNull();

    const invalidRole = await encodeSession(
      { ...valid, role: "owner" as Session["role"] },
      TEST_SESSION_SECRET,
    );
    expect(await decodeSession(invalidRole, TEST_SESSION_SECRET)).toBeNull();
  });

  test("Cookieに意図した防御属性と14日の有効期限を付ける", async () => {
    const token = await encodeSession({
      userId: "member-1",
      role: "member",
      exp: Date.now() + 60_000,
    }, TEST_SESSION_SECRET);
    const cookie = sessionCookie(token);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=1209600");
  });
});

describe("メンバー入場", () => {
  test("新規登録は残高0のメンバーを作り、Cookieを発行する", async () => {
    const { response } = await registerMember("🐎 テスト");
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/");
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    const user = await env.DB.prepare(
      "SELECT role, balance, deleted_at FROM users WHERE display_name = ?",
    ).bind("🐎 テスト").first<{ role: string; balance: number; deleted_at: number | null }>();
    expect(user).toEqual({ role: "member", balance: 0, deleted_at: null });
  });

  test("共有パス誤り・空白名・41文字名・同名登録を拒否する", async () => {
    const wrongPassword = await postForm("/login", {
      mode: "register",
      display_name: "新規",
      password: "wrong",
    });
    expect(wrongPassword.headers.get("Location")).toContain("err=1");

    for (const displayName of ["   ", "あ".repeat(41)]) {
      const response = await postForm("/login", {
        mode: "register",
        display_name: displayName,
        password: TEST_MEMBER_PASSWORD,
      });
      expect(response.headers.get("Location")).toContain("err=1");
    }

    await registerMember("重複名");
    const duplicate = await postForm("/login", {
      mode: "register",
      display_name: "重複名",
      password: TEST_MEMBER_PASSWORD,
    });
    expect(decodeURIComponent(duplicate.headers.get("Location") ?? "")).toContain("すでに使われています");
  });

  test("登録済みメンバーは再入場でき、未登録名は拒否する", async () => {
    await registerMember("再入場者");
    const login = await postForm("/login", {
      mode: "login",
      display_name: "再入場者",
      password: TEST_MEMBER_PASSWORD,
    });
    expect(login.status).toBe(303);
    expect(cookiePair(login)).toContain("oshi_session=");

    const missing = await postForm("/login", {
      mode: "login",
      display_name: "未登録者",
      password: TEST_MEMBER_PASSWORD,
    });
    expect(missing.headers.get("Location")).toContain("err=1");
  });

  test("利用停止後は発行済みCookieでも保護画面へ入れない", async () => {
    const { cookie } = await registerMember("停止対象");
    await env.DB.prepare("UPDATE users SET deleted_at = ? WHERE display_name = ?")
      .bind(Date.now(), "停止対象").run();
    const response = await workerFetch("/bet", {}, cookie);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");
  });

  test("ログアウトはCookieを削除する", async () => {
    const { cookie } = await registerMember("ログアウト対象");
    const response = await workerFetch("/logout", {}, cookie);
    expect(response.status).toBe(303);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});

describe("管理者ログイン", () => {
  test("固定IDとDB権限が揃う場合だけ管理Cookieを発行する", async () => {
    const admin = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
      .bind(TEST_ADMIN_USER_ID).first<{ role: string }>();
    expect(admin?.role).toBe("admin");

    const { response } = await loginAdmin();
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin");
    expect(cookiePair(response)).toContain("oshi_session=");
  });

  test("パス誤りとDB権限不一致を拒否する", async () => {
    const wrongPassword = await postForm("/admin/login", { password: "wrong" });
    expect(wrongPassword.headers.get("Set-Cookie")).toBeNull();
    expect(wrongPassword.headers.get("Location")).toContain("err=1");

    await env.DB.prepare("UPDATE users SET role = 'member' WHERE id = ?")
      .bind(TEST_ADMIN_USER_ID).run();
    const wrongRole = await postForm("/admin/login", { password: TEST_ADMIN_PASSWORD });
    expect(wrongRole.headers.get("Set-Cookie")).toBeNull();
    expect(decodeURIComponent(wrongRole.headers.get("Location") ?? ""))
      .toContain("管理者の設定が完了していません");
  });
});
