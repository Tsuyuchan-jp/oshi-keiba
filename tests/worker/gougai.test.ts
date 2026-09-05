import { describe, expect, test } from "vitest";
import { loginAdmin, workerFetch } from "./helpers";

describe("号外タブ", () => {
  test("プレビューと編集・PNG/WebP ボタンを出す", async () => {
    const { cookie } = await loginAdmin();
    const response = await workerFetch("/admin/gougai", {}, cookie);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(">号外<");
    expect(html).toContain("gougai-paper");
    expect(html).toContain("1着未入力");
    expect(html).toContain('id="gougai-png"');
    expect(html).toContain('id="gougai-webp"');
    expect(html).toContain('id="gougai-masthead"');
    expect(html).toContain('id="gougai-overlay"');
    expect(html).toContain('id="gougai-subs-open"');
    expect(html).toContain('id="gougai-subs-modal"');
    expect(html).toContain('id="gougai-photo-input"');
    expect(html).toContain('id="gougai-photo-reset"');
    expect(html).toContain('id="gougai-photo-editor"');
    expect(html).toContain('id="gougai-body"');
    expect(html).toContain("未登録");
    expect(html).not.toContain("意気込み");
    expect(html).toContain("/vendor/modern-screenshot.mjs");
    expect(html).toContain("M+PLUS+1p");
  });
});
