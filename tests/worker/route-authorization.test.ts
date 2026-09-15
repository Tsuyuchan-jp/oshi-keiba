import { env } from "cloudflare:workers";
import { describe, expect, test } from "vitest";
import {
  insertUser,
  loginAdmin,
  postForm,
  registerMember,
  signedCookie,
  workerFetch,
} from "./helpers";

const ADMIN_GET_PATHS = [
  "/admin",
  "/admin/register",
  "/admin/horses",
  "/admin/ledger",
  "/admin/odds",
  "/admin/settings",
  "/admin/umabashira",
  "/admin/gougai",
  "/admin/shot/missing",
  "/admin/trainer-icon/missing",
  "/admin/api/strategic-skills",
  "/admin/api/strategic-skills/export",
] as const;

const ADMIN_POST_PATHS = [
  "/admin/params/preview",
  "/admin/params",
  "/admin/rescore",
  "/admin/horse",
  "/admin/horse-edit",
  "/admin/horse-drop",
  "/admin/horse-numbers",
  "/admin/open",
  "/admin/close",
  "/admin/next-event",
  "/admin/clear-horses",
  "/admin/discard-event",
  "/admin/revert-voting",
  "/admin/scratch",
  "/admin/places",
  "/admin/publish",
  "/admin/member-delete",
  "/admin/reset",
  "/admin/api/strategic-skills",
  "/admin/api/strategic-skills/dismiss",
  "/admin/api/strategic-skills/preview",
] as const;

const MEMBER_GET_PATHS = [
  "/bet",
  "/paddock",
  "/paddock/shot/missing",
  "/paddock/trainer-icon/missing",
] as const;

const MEMBER_POST_PATHS = ["/bet", "/bet/join", "/bet/redo"] as const;

describe("公開経路", () => {
  test.each(["/login", "/", "/board", "/api/board", "/admin/login"])(
    "未認証でもGET %sを開ける",
    async (path) => {
      const response = await workerFetch(path);
      expect(response.status).toBe(200);
    },
  );
});

describe("管理経路の権限", () => {
  test.each([
    "/twinkle/frames/gougai_bg.png",
    "/twinkle/subtitles/000.png",
    "/images/umamusume/stand/chara_stand_1001_100101.png",
  ])("未認証GET %sでは号外素材を返さない", async (path) => {
    const response = await workerFetch(path);
    expect(response.status).toBe(404);
  });

  test("メンバーには号外素材を返さない", async () => {
    const userId = await insertUser({ displayName: "素材閲覧メンバー" });
    const cookie = await signedCookie(userId, "member");
    const response = await workerFetch("/twinkle/frames/gougai_bg.png", {}, cookie);
    expect(response.status).toBe(404);
  });

  test("管理者にはR2の号外背景を返す", async () => {
    const image = new Uint8Array([137, 80, 78, 71]);
    await env.SHOTS.put("_app-assets/gougai_bg.png", image, {
      httpMetadata: { contentType: "image/png" },
    });
    const { cookie } = await loginAdmin();
    const response = await workerFetch("/twinkle/frames/gougai_bg.png", {}, cookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(image);
  });

  test.each(ADMIN_GET_PATHS)("未認証GET %sを管理ログインへ戻す", async (path) => {
    const response = await workerFetch(path);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin/login");
  });

  test.each(ADMIN_POST_PATHS)("未認証POST %sを管理ログインへ戻す", async (path) => {
    const response = await postForm(path);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin/login");
  });

  test.each(ADMIN_GET_PATHS)("メンバーGET %sを管理ログインへ戻す", async (path) => {
    const { cookie } = await registerMember(`閲覧-${crypto.randomUUID()}`);
    const response = await workerFetch(path, {}, cookie);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin/login");
  });

  test("管理者は8つの管理画面を開ける", async () => {
    const { cookie } = await loginAdmin();
    for (const path of ADMIN_GET_PATHS.slice(0, 8)) {
      const response = await workerFetch(path, {}, cookie);
      expect(response.status, path).toBe(200);
    }
  });

  test("管理者だけが戦略例外一覧とexportを取得できる", async () => {
    const { cookie } = await loginAdmin();
    const list = await workerFetch("/admin/api/strategic-skills", {}, cookie);
    expect(list.status).toBe(200);
    const listed = await list.json<{
      skills: Array<{ skillId: number; name: string; points: number; memo: string }>;
      dismissed: unknown[];
    }>();
    expect(listed.skills).toHaveLength(4);
    expect(listed.skills.map((skill) => skill.skillId).sort()).toEqual([
      200431,
      200452,
      201262,
      210052,
    ]);
    expect(listed.dismissed).toEqual([]);

    const exported = await workerFetch("/admin/api/strategic-skills/export", {}, cookie);
    expect(exported.status).toBe(200);
    expect(exported.headers.get("Content-Disposition")).toContain("strategic-skills.json");
    const exportedJson = await exported.json<{
      exportedAt: string;
      skills: Array<{ id: number }>;
      dismissed: unknown[];
    }>();
    expect(Number.isNaN(Date.parse(exportedJson.exportedAt))).toBe(false);
    expect(exportedJson.skills.map((skill) => skill.id).sort()).toEqual([
      200431,
      200452,
      201262,
      210052,
    ]);
    expect(exportedJson.dismissed).toEqual([]);
  });
});

describe("メンバー経路の権限", () => {
  test.each(MEMBER_GET_PATHS)("未認証GET %sを入場へ戻す", async (path) => {
    const response = await workerFetch(path);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");
  });

  test.each(MEMBER_POST_PATHS)("未認証POST %sを入場へ戻す", async (path) => {
    const response = await postForm(path);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");
  });

  test("メンバーは窓口とパドックを開ける", async () => {
    const { cookie } = await registerMember("画面閲覧メンバー");
    for (const path of ["/bet", "/paddock"]) {
      const response = await workerFetch(path, {}, cookie);
      expect(response.status, path).toBe(200);
    }
  });

  test.each(MEMBER_POST_PATHS)("管理者POST %sではメンバー操作を実行しない", async (path) => {
    const { cookie } = await loginAdmin();
    const response = await postForm(path, {}, cookie);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");
  });

  test("管理者は閲覧プレビューとして窓口とパドックを開ける", async () => {
    const { cookie } = await loginAdmin();
    for (const path of ["/bet", "/paddock"]) {
      const response = await workerFetch(path, {}, cookie);
      expect(response.status, path).toBe(200);
    }
  });
});
