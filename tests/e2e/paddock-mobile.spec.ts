import { expect, test } from "@playwright/test";

test("short mobile paddock keeps every horse reachable and closes detail by downward swipe", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.setViewportSize({ width: 375, height: 664 });
  await page.goto("/login");
  await page.locator('input[name="display_name"]').fill("E2E short mobile");
  await page.locator('input[name="password"]').fill("e2e-member-password");
  await page.locator('button[name="mode"][value="register"]').click();

  await page.goto("/paddock");
  const stage = page.locator(".paddock-stage");
  await expect(page.locator("html")).toHaveCSS("background-size", "cover");
  await expect(page.locator("html")).toHaveCSS("overflow-x", "hidden");
  await expect(page.locator("body")).toHaveCSS("background-image", "none");
  await expect(stage).toHaveCSS("background-image", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("html")).toHaveCSS("background-size", "cover");
  const largeStageWidth = await stage.evaluate((element) => element.getBoundingClientRect().width);
  expect(largeStageWidth).toBe(390);
  const largePageWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(largePageWidth.scrollWidth).toBe(largePageWidth.clientWidth);
  expect(largePageWidth.scrollHeight).toBe(largePageWidth.clientHeight);
  await page.setViewportSize({ width: 375, height: 664 });
  const horses = page.locator(".horse");
  await expect(horses).toHaveCount(3);
  const pageSize = await page.evaluate(() => ({
    height: document.documentElement.clientHeight,
    contentHeight: document.documentElement.scrollHeight,
  }));
  expect(pageSize.contentHeight).toBeGreaterThan(pageSize.height);
  await horses.last().scrollIntoViewIfNeeded();
  await expect(horses.last()).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));
  await horses.first().click();
  const detail = page.locator("#detail");
  await expect(detail).toHaveClass(/open/);
  const handle = page.locator(".detail__summary");
  const box = await handle.boundingBox();
  if (!box) throw new Error("detail swipe handle is unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 140, { steps: 4 });
  await page.mouse.up();
  await expect(detail).not.toHaveClass(/open/);
  expect(pageErrors).toEqual([]);
});
