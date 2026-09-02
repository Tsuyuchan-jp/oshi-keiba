import { SELF } from "cloudflare:test";
import { describe, expect, test } from "vitest";

describe("Worker 結合テスト基盤", () => {
  test("全 migration 適用後に入場・場内・管理ログイン画面を返す", async () => {
    const [login, board, adminLogin] = await Promise.all([
      SELF.fetch("https://worker.test/login"),
      SELF.fetch("https://worker.test/"),
      SELF.fetch("https://worker.test/admin/login"),
    ]);

    expect(login.status).toBe(200);
    expect(await login.text()).toContain("入場");
    expect(board.status).toBe(200);
    expect(await board.text()).toContain("推し活イベントレース");
    expect(adminLogin.status).toBe(200);
    expect(await adminLogin.text()).toContain("管理者ログイン");
  });

  test("未知のWorker経路は404になる", async () => {
    const response = await SELF.fetch("https://worker.test/not-found");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("ページがありません");
  });
});
