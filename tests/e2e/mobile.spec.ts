import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function expectMemberChromeFits(page: Page): Promise<void> {
  await expect(page.locator(".chrome-brand .brand")).toBeVisible();
  await expect(page.locator("#meta-close")).toBeVisible();
  const collision = await page.evaluate(() => {
    const brand = document.querySelector(".chrome-brand")?.getBoundingClientRect();
    const state = document.querySelector(".chrome-state")?.getBoundingClientRect();
    const close = document.querySelector("#meta-close")?.getBoundingClientRect();
    if (!brand || !state || !close) return true;
    const overlap = !(
      brand.right <= state.left ||
      brand.left >= state.right ||
      brand.bottom <= state.top ||
      brand.top >= state.bottom
    );
    const closeHidden = close.width <= 0 || close.height <= 0;
    return overlap || closeHidden;
  });
  expect(collision).toBe(false);
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
  await expect(page.locator(".board-head-title")).toHaveText("E2E開催");
  await expectNoHorizontalOverflow(page);
  await expectMemberChromeFits(page);

  const umabashiraButton = page.getByRole("button", { name: "ウマ柱を見る" });
  await expect(umabashiraButton).toBeVisible();
  const footOrder = await page.evaluate(() => {
    const sheet = document.querySelector("#umabashira-open")?.getBoundingClientRect();
    const actions = document.querySelector(".foot-actions")?.getBoundingClientRect();
    return sheet && actions ? sheet.bottom <= actions.top + 1 : false;
  });
  expect(footOrder).toBe(true);
  await umabashiraButton.click();
  const modal = page.locator("#umabashira-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".umabashira-paper")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).not.toBe("umabashira-zoom-out");
  const modalSize = await modal.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
  }));
  expect(modalSize.width).toBeGreaterThanOrEqual(modalSize.viewportWidth - 1);
  expect(modalSize.height).toBeGreaterThanOrEqual(modalSize.viewportHeight - 1);
  await expect(page.locator("#umabashira-viewport")).toHaveCSS("background-image", /gradient/);
  const beforeZoom = await page.locator("#umabashira-canvas").evaluate((element) => getComputedStyle(element).transform);
  await page.getByRole("button", { name: "拡大" }).click();
  const afterZoom = await page.locator("#umabashira-canvas").evaluate((element) => getComputedStyle(element).transform);
  expect(afterZoom).not.toBe(beforeZoom);
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(modal).not.toBeVisible();

  await page.goto("/bet");
  await page.getByRole("button", { name: /E2E開催に参加/ }).click();
  await expect(page.locator('.chip[data-n="1"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "買う" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectMemberChromeFits(page);

  await page.locator('.chip[data-n="1"]').click();
  await page.getByRole("button", { name: "+100" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "買う" }).click();
  const betGlass = await page.evaluate(() => ({
    chrome: getComputedStyle(document.querySelector(".bet-chrome")!).backgroundColor,
    body: getComputedStyle(document.querySelector(".desk")!).backgroundColor,
  }));
  await page.goto("/tickets");
  await expect(page.locator(".bet-ticket")).toBeVisible();
  const ticketGlass = await page.evaluate(() => ({
    chrome: getComputedStyle(document.querySelector(".ticket-chrome")!).backgroundColor,
    body: getComputedStyle(document.querySelector(".ticket-page")!).backgroundColor,
  }));
  expect(ticketGlass).toEqual(betGlass);
  await expect(page.locator(".ticket-hero")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expectNoHorizontalOverflow(page);
  await expectMemberChromeFits(page);
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

test("モバイル幅の台帳はページを固定し、ダッシュボード内だけスクロールする", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("仮パスワード").fill("e2e-admin-password");
  await page.getByRole("button", { name: "管理画面へ" }).click();
  await page.goto("/admin/ledger");

  await expect(page.getByText("場の管理スペ残高")).toBeVisible();
  const metrics = await page.evaluate(() => {
    const desk = document.querySelector<HTMLElement>(".ledger-desk");
    return {
      pageHeight: document.scrollingElement?.scrollHeight ?? 0,
      viewportHeight: document.documentElement.clientHeight,
      deskClientHeight: desk?.clientHeight ?? 0,
      deskScrollHeight: desk?.scrollHeight ?? 0,
    };
  });
  expect(metrics.pageHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.deskScrollHeight).toBeGreaterThan(metrics.deskClientHeight);
  await expectNoHorizontalOverflow(page);
});
