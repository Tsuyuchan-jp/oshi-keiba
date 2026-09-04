import { describe, expect, test } from "vitest";
import { loginAdmin, workerFetch } from "./helpers";

describe("ウマ柱タブ", () => {
  test("プレビューと PNG/WebP ボタンを出す", async () => {
    const { cookie } = await loginAdmin();
    const response = await workerFetch("/admin/umabashira", {}, cookie);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(">ウマ柱<");
    expect(html).toContain("umabashira-paper");
    expect(html).toContain('id="umabashira-png"');
    expect(html).toContain('id="umabashira-webp"');
    expect(html).toContain("番・脚");
    expect(html).toContain("/vendor/modern-screenshot.mjs");
    expect(html).toContain("第1段は自動差し込み");
  });
});
