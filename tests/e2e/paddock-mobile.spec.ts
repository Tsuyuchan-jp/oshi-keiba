import { expect, test, type Page } from "@playwright/test";

async function loginMember(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="display_name"]').fill("E2E paddock mobile");
  await page.locator('input[name="password"]').fill("e2e-member-password");
  await page.locator('button[name="mode"][value="register"]').click();
}

async function mockEighteenHorses(page: Page): Promise<void> {
  await page.route("**/paddock", async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    const prefix = "<script>window.__PADDOCK__=";
    const start = body.indexOf(prefix) + prefix.length;
    const end = body.indexOf(';</script><script src="/paddock.js"', start);
    if (start < prefix.length || end < 0) throw new Error("paddock data script was not found");
    const view = JSON.parse(body.slice(start, end));
    const source = view.horses[0];
    const styles = [
      ...Array(9).fill("runner"),
      ...Array(5).fill("leader"),
      ...Array(2).fill("betweener"),
      ...Array(2).fill("chaser"),
    ];
    view.horses = styles.map((style, index) => ({
      ...source,
      id: `mobile-horse-${index + 1}`,
      number: index + 1,
      style,
      listImageUrl: "/images/umamusume/petit/petit_1006_100601_0011.png",
      detailImageUrl: "/images/umamusume/petit/petit_1006_100601_0010.png",
      umaName: `mobile horse ${index + 1}`,
    }));
    body = `${body.slice(0, start)}${JSON.stringify(view)}${body.slice(end)}`;
    await route.fulfill({ response, body });
  });
}

async function expectNoPageScroll(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(size.scrollWidth).toBe(size.clientWidth);
  expect(size.scrollHeight).toBe(size.clientHeight);
}

test("18 horses fit vertically without changing the mobile horizontal layout", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await loginMember(page);
  await mockEighteenHorses(page);
  await page.goto("/paddock");

  const horses = page.locator(".horse");
  await expect(horses).toHaveCount(18);
  await expectNoPageScroll(page);
  const compactLayout = await page.evaluate(() => {
    const horseRects = Array.from(document.querySelectorAll(".horse")).map((horse) => horse.getBoundingClientRect());
    const fiveHorseRow = Array.from(document.querySelectorAll(".horse-row"))
      .find((row) => row.children.length === 5)!;
    return {
      minTop: Math.min(...horseRects.map((rect) => rect.top)),
      maxBottom: Math.max(...horseRects.map((rect) => rect.bottom)),
      horseHeight: horseRects[0]!.height,
      fiveHorseWidth: fiveHorseRow.querySelector(".horse")!.getBoundingClientRect().width,
      viewportHeight: innerHeight,
    };
  });
  expect(compactLayout.minTop).toBeGreaterThanOrEqual(0);
  expect(compactLayout.maxBottom).toBeLessThanOrEqual(compactLayout.viewportHeight);
  expect(compactLayout.horseHeight).toBeLessThan(96);
  expect(compactLayout.fiveHorseWidth).toBeCloseTo(63.75, 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoPageScroll(page);
  const roomyLayout = await page.locator(".horse-row").filter({ has: page.locator(".horse") }).first().evaluate(() => ({
    horseHeight: document.querySelector(".horse")!.getBoundingClientRect().height,
    fiveHorseWidth: Array.from(document.querySelectorAll(".horse-row"))
      .find((row) => row.children.length === 5)!
      .querySelector(".horse")!
      .getBoundingClientRect().width,
  }));
  expect(roomyLayout.horseHeight).toBeCloseTo(96, 3);
  expect(roomyLayout.fiveHorseWidth).toBe(64);

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

  await horses.first().click();
  await expect(detail).toHaveClass(/open/);
  await detail.evaluate((element) => {
    const target = element.querySelector(".profile") ?? element;
    const dispatch = (type: "touchstart" | "touchmove" | "touchend", y: number) => {
      const touch = new Touch({ identifier: 1, target, clientX: 160, clientY: y });
      target.dispatchEvent(new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: type === "touchend" ? [] : [touch],
        changedTouches: [touch],
      }));
    };
    element.scrollTop = 0;
    dispatch("touchstart", 300);
    dispatch("touchmove", 440);
    dispatch("touchend", 440);
  });
  await expect(detail).not.toHaveClass(/open/);
});
