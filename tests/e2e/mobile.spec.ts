import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport + 1);
}

test("モバイル幅でも入場・場内・窓口の主要操作が画面内に収まる", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "入場" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByLabel("表示名").fill("E2Eモバイル");
  await page.getByLabel("共有パス").fill("e2e-member-password");
  await page.getByRole("button", { name: "初めて入場" }).click();
  await expect(page.getByText("E2E開催")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/bet");
  await page.getByRole("button", { name: /E2E開催に参加/ }).click();
  await expect(page.locator('.chip[data-n="1"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "買う" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test("モバイル幅でもウマ柱管理画面はページ全体からはみ出さない", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/admin/login");
  await page.getByLabel("仮パスワード").fill("e2e-admin-password");
  await page.getByRole("button", { name: "管理画面へ" }).click();
  await page.goto("/admin/umabashira");

  await expect(page.locator("#umabashira-paper")).toBeVisible();
  await expect(page.locator("#umabashira-png")).toBeVisible();
  await expect(page.locator("#umabashira-webp")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});
