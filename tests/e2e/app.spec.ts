import { expect, test, type Page } from "@playwright/test";

function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

async function registerMember(page: Page, name: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("表示名").fill(name);
  await page.getByLabel("共有パス").fill("e2e-member-password");
  await page.getByRole("button", { name: "初めて入場" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("メンバーが入場・参加し、画面操作で単勝を購入できる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await registerMember(page, "E2Eメンバー");
  await expect(page.getByText("E2E開催")).toBeVisible();
  await expect(page.getByText("E2Eメンバー · 0 スペ")).toBeVisible();

  await page.goto("/bet");
  await expect(page.getByRole("heading", { name: "窓口" })).toBeVisible();
  await page.getByRole("button", { name: /E2E開催に参加/ }).click();
  await expect(page.locator("#bal")).toHaveText("3,000");

  await page.locator('.chip[data-n="1"]').click();
  await page.getByRole("button", { name: "+100" }).click();
  await expect(page.locator("#buy-guide")).toContainText("内容を確認");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "買う" }).click();

  await expect(page.getByText("買いました")).toBeVisible();
  await expect(page.locator("#bal")).toHaveText("2,900");
  await expect(page.locator('.tickets .t-row[data-sel="e2e-horse-1"]')).toContainText("100");
  expect(pageErrors).toEqual([]);
});

test("管理者が主要画面を巡回でき、メンバー画面ではプレビューになる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("仮パスワード").fill("e2e-admin-password");
  await page.getByRole("button", { name: "管理画面へ" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "E2E開催" })).toBeVisible();

  for (const path of [
    "/admin/register",
    "/admin/horses",
    "/admin/ledger",
    "/admin/odds",
    "/admin/settings",
    "/admin/umabashira",
    "/admin/gougai",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
  }

  await page.goto("/bet");
  await expect(page.locator(".admin-preview")).toContainText("管理者プレビュー");
  await expect(page.getByRole("button", { name: "買う" })).toBeDisabled();
  await page.goto("/paddock");
  await expect(page.locator("body")).toContainText("スペシャルウィーク");
  expect(pageErrors).toEqual([]);
});

test("管理者は号外の背景と立ち絵を画像へ差し替え、テンプレートへ戻せる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/admin/login");
  await page.getByLabel("仮パスワード").fill("e2e-admin-password");
  await page.getByRole("button", { name: "管理画面へ" }).click();
  await page.goto("/admin/gougai");

  await page.locator("#gougai-photo-input").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  const cover = page.locator(".gougai-paper .cover");
  await expect(cover).toHaveClass(/has-custom-photo/);
  await expect(page.locator(".gougai-paper .cover-titles")).toBeVisible();
  await expect(page.locator(".gougai-paper .cover-blue")).toBeVisible();
  await expect(page.locator("#gougai-photo-controls")).toBeVisible();

  await page.getByRole("button", { name: "テンプレートに戻す" }).click();
  await expect(cover).not.toHaveClass(/has-custom-photo/);

  await page.locator("#gougai-photo-input").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  await expect(cover).toHaveClass(/has-custom-photo/);
  await page.reload();
  await expect(cover).not.toHaveClass(/has-custom-photo/);
  expect(pageErrors).toEqual([]);
});
