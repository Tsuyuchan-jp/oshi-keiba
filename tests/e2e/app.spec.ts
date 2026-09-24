import { stat } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("仮パスワード").fill("e2e-admin-password");
  await page.getByRole("button", { name: "管理画面へ" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function expectDownload(page: Page, buttonId: string, extension: "png" | "webp"): Promise<void> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(buttonId).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`^\\d{4}-\\d{2}-\\d{2}-E2E開催-.+\\.${extension}$`));
  const path = await download.path();
  expect(path).not.toBeNull();
  if (path) expect((await stat(path)).size).toBeGreaterThan(0);
}

test("メンバーが入場・参加し、画面操作で単勝を購入できる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await registerMember(page, "E2Eメンバー");
  await expect(page.locator(".board-head-title")).toHaveText("E2E開催");
  await expect(page.getByText("E2Eメンバー · 0 スペ")).toBeVisible();

  await page.getByRole("button", { name: "ウマ柱を見る" }).click();
  const umabashiraViewport = page.locator("#umabashira-viewport");
  const umabashiraPaper = page.locator("#umabashira-modal .umabashira-paper");
  await expect(umabashiraPaper).toBeVisible();
  await expect(umabashiraViewport).toHaveCSS("user-select", "none");
  const initialLayout = await page.evaluate(() => {
    const viewport = document.querySelector("#umabashira-viewport")!.getBoundingClientRect();
    const paper = document.querySelector("#umabashira-modal .umabashira-paper")!.getBoundingClientRect();
    return {
      horizontal: Math.abs((paper.left + paper.right) / 2 - (viewport.left + viewport.right) / 2),
      vertical: Math.abs((paper.top + paper.bottom) / 2 - (viewport.top + viewport.bottom) / 2),
      background: getComputedStyle(document.querySelector("#umabashira-viewport")!).backgroundImage,
    };
  });
  expect(initialLayout.horizontal).toBeLessThanOrEqual(1);
  expect(initialLayout.vertical).toBeLessThanOrEqual(1);
  expect(initialLayout.background).not.toBe("none");
  const initialFill = await page.evaluate(() => {
    const viewport = document.querySelector("#umabashira-viewport")!.getBoundingClientRect();
    const paper = document.querySelector("#umabashira-modal .umabashira-paper")!.getBoundingClientRect();
    return Math.max(paper.width / viewport.width, paper.height / viewport.height);
  });
  expect(initialFill).toBeGreaterThan(0.85);
  const beforeWheelZoom = await umabashiraPaper.evaluate((element) => Number((element as HTMLElement).style.zoom));
  await umabashiraViewport.hover();
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => umabashiraPaper.evaluate((element) => Number((element as HTMLElement).style.zoom))).toBeGreaterThan(beforeWheelZoom);
  await page.getByRole("button", { name: "閉じる" }).click();

  await page.getByRole("button", { name: "ウマ柱を見る" }).click();
  await page.mouse.click(4, 300);
  await expect(page.locator("#umabashira-modal")).not.toBeVisible();

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
  await expect(page.locator(".ticket-shelf-link")).toContainText("1枚・合計 100 スペ");
  await page.locator(".ticket-shelf-link").click();
  await expect(page).toHaveURL(/\/tickets$/);
  await expect(page.getByRole("heading", { name: "自分の馬券" })).toBeVisible();
  await expect(page.locator(".bet-ticket")).toHaveCount(1);
  await expect(page.locator(".bet-ticket")).toContainText("100 スペ");
  await expect(page.locator(".bet-ticket")).toContainText("スペシャルウィーク");
  expect(pageErrors).toEqual([]);
});

test("管理者が主要画面を巡回でき、メンバー画面ではプレビューになる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await loginAdmin(page);
  await expect(page.getByRole("heading", { name: "E2E開催" })).toBeVisible();

  for (const path of [
    "/admin/register",
    "/admin/horses",
    "/admin/ledger",
    "/admin/odds",
    "/admin/settings",
    "/admin/analysis",
    "/admin/umabashira",
    "/admin/gougai",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    if (path === "/admin/ledger") {
      await expect(page.getByText("場の管理スペ残高")).toBeVisible();
      const viewport = await page.evaluate(() => ({
        pageHeight: document.scrollingElement?.scrollHeight ?? 0,
        viewportHeight: document.documentElement.clientHeight,
      }));
      expect(viewport.pageHeight).toBeLessThanOrEqual(viewport.viewportHeight + 1);
    }
  }

  await page.goto("/bet");
  await expect(page.locator(".admin-preview")).toContainText("管理者プレビュー");
  await expect(page.getByRole("button", { name: "買う" })).toBeDisabled();
  await page.goto("/tickets");
  await expect(page.getByText("管理者確認用の表示です。購入操作はできません。")).toBeVisible();
  await page.goto("/paddock");
  await expect(page.locator("body")).toContainText("スペシャルウィーク");
  expect(pageErrors).toEqual([]);
});

test("管理者はウマ柱の紙面を確認し、PNGとWebPを書き出せる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await loginAdmin(page);
  await page.goto("/admin/umabashira");

  const paper = page.locator("#umabashira-paper");
  await expect(paper).toBeVisible();
  await expect(page.locator(".umabashira-paper .board .col:not(.stub-col)")).toHaveCount(3);
  await expect(page.locator(".umabashira-paper .score-cell").nth(1)).toContainText("30.0");
  await expect(page.locator(".umabashira-paper .odds-cell").nth(1)).not.toContainText("NaN");

  const layout = await paper.evaluate((element) => {
    const paperElement = element as HTMLElement;
    const title = element.querySelector<HTMLElement>(".mast .title")!;
    const splitLabels = Array.from(element.querySelectorAll<HTMLElement>(".stub-split > span"));
    return {
      boxSizing: getComputedStyle(element).boxSizing,
      borderWidth: paperElement.offsetWidth - paperElement.clientWidth,
      titleWhiteSpace: getComputedStyle(title).whiteSpace,
      splitWhiteSpace: splitLabels.map((label) => getComputedStyle(label).whiteSpace),
    };
  });
  expect(layout).toEqual({
    boxSizing: "content-box",
    borderWidth: 4,
    titleWhiteSpace: "nowrap",
    splitWhiteSpace: ["nowrap", "nowrap"],
  });

  const runner = page.locator(".umabashira-paper .board .col:not(.stub-col) .runner span").first();
  await runner.evaluate((element) => {
    element.textContent = "長い名前確認";
  });
  const initialFontSize = await runner.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  await expectDownload(page, "#umabashira-png", "png");
  const fitted = await runner.evaluate((element) => ({
    fontSize: parseFloat(getComputedStyle(element).fontSize),
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(fitted.fontSize).toBeLessThan(initialFontSize);
  expect(fitted.scrollWidth).toBeLessThanOrEqual(fitted.clientWidth + 1);
  await expectDownload(page, "#umabashira-webp", "webp");
  expect(pageErrors).toEqual([]);
});

test("OCRが1頭分を配列JSONで返しても確認画面へ反映する", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await loginAdmin(page);
  const reverted = await page.request.post("/admin/revert-voting", {
    form: { admin_reauth: "e2e-admin-password" },
  });
  expect(reverted.ok()).toBe(true);

  let responseIndex = 0;
  await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
    const roots = [[{
      name: "スペシャルウィーク",
      trainerName: "配列トレーナー",
      costumeName: "スペシャルドリーマー",
      stats: { speed: 1200, stamina: 950, power: 1100, guts: 850, wisdom: 1000 },
      aptitudes: {
        turf: "S", dirt: "G", short: "G", mile: "A", medium: "S", long: "A",
        nige: "A", senkou: "S", sashi: "A", oikomi: "C",
      },
      skills: [],
    }], []];
    const text = JSON.stringify(roots[Math.min(responseIndex, roots.length - 1)]);
    responseIndex += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    });
  });

  try {
    await page.goto("/admin/register");
    await page.getByLabel("Gemini API キー").fill("e2e-gemini-key");
    await page.locator("#gemini-save").click();
    await page.locator("#ocr-file").setInputFiles({
      name: "status.png",
      mimeType: "image/png",
      buffer: ONE_PIXEL_PNG,
    });
    await page.locator("#ocr-run").click();

    await expect(page.locator("#horse-add")).toHaveAttribute("data-mode", "read");
    await expect(page.locator("#uma-name")).toHaveValue("スペシャルウィーク");
    await expect(page.locator("#runner-name")).toHaveValue("配列トレーナー");
    await expect(page.locator("#style-key")).toHaveValue("leader");
    const scoreInput = JSON.parse(await page.locator("#score-input").inputValue());
    expect(scoreInput.stats).toEqual({ speed: 1200, stamina: 950, power: 1100, guts: 850, wisdom: 1000 });

    await page.locator("#do-idle").click();
    await page.locator("#ocr-file").setInputFiles({
      name: "empty.png",
      mimeType: "image/png",
      buffer: ONE_PIXEL_PNG,
    });
    await page.locator("#ocr-run").click();
    await expect(page.locator("#ocr-status")).toHaveText("JSONの形が違います");
  } finally {
    await page.request.post("/admin/open");
  }
  expect(pageErrors).toEqual([]);
});

test("管理者は号外の背景と立ち絵を画像へ差し替え、テンプレートへ戻せる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await loginAdmin(page);
  await page.goto("/admin/gougai");
  await expect(page.locator("#gougai-photo-controls")).toBeHidden();
  const subtitlesModal = page.locator("#gougai-subs-modal");
  await expect(subtitlesModal).toBeHidden();
  await page.getByRole("button", { name: "右列画像を選ぶ" }).click();
  await expect(subtitlesModal).toBeVisible();
  const subtitleSize = await page.locator(".gougai-sub").first().evaluate((el) => ({
    width: el.getBoundingClientRect().width,
    height: el.getBoundingClientRect().height,
  }));
  expect(subtitleSize.height / subtitleSize.width).toBeCloseTo(1 / .106, 1);
  const paperSubtitleSize = await page.locator(".gougai-paper .sub-img-wrap").evaluate((el) => {
    const image = el.querySelector("img")!;
    return {
      wrapperHeight: el.getBoundingClientRect().height,
      imageHeight: image.getBoundingClientRect().height,
    };
  });
  expect(paperSubtitleSize.imageHeight / paperSubtitleSize.wrapperHeight).toBeCloseTo(4 / 3, 2);
  const selectedSubtitle = page.locator(".gougai-sub").nth(1);
  const selectedFile = await selectedSubtitle.getAttribute("data-file");
  await selectedSubtitle.click();
  await expect(subtitlesModal).toBeHidden();
  await expect(page.locator("#gougai-sub-name")).toHaveText(selectedFile || "");

  await page.locator("#gougai-masthead").fill("E2E号外");
  const overlay = page.locator("#gougai-overlay");
  await overlay.selectOption({ index: 1 });
  const selectedOverlay = await overlay.inputValue();
  await expect(page.locator(".gougai-paper .masthead")).toHaveText("E2E号外");
  await page.reload();
  await expect(page.locator("#gougai-masthead")).toHaveValue("E2E号外");
  await expect(page.locator("#gougai-overlay")).toHaveValue(selectedOverlay);
  await expect(page.locator("#gougai-sub-name")).toHaveText(selectedFile || "");

  await page.locator("#gougai-photo-input").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });
  const cover = page.locator(".gougai-paper .cover");
  await expect(cover).toHaveClass(/has-custom-photo/);
  await expect(page.locator(".gougai-paper .cover-titles")).toBeVisible();
  await expect(page.locator(".gougai-paper .cover-blue")).toBeVisible();
  await expect(page.locator("#gougai-photo-controls")).toBeVisible();

  await page.locator("#gougai-photo-zoom").fill("2");
  const editor = page.locator("#gougai-photo-editor");
  const editorImage = page.locator("#gougai-photo-editor-image");
  const beforeDrag = await editorImage.getAttribute("style");
  const box = await editor.boundingBox();
  if (!box) throw new Error("画像編集枠の位置を取得できません");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20);
  await page.mouse.up();
  await expect.poll(() => editorImage.getAttribute("style")).not.toBe(beforeDrag);
  await expect(page.locator("#gougai-photo")).toHaveAttribute("style", /width: .*px/);

  await page.getByRole("button", { name: "テンプレートに戻す" }).click();
  await expect(cover).not.toHaveClass(/has-custom-photo/);

  await page.locator("#gougai-photo-input").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });
  await expect(cover).toHaveClass(/has-custom-photo/);
  await page.reload();
  await expect(cover).not.toHaveClass(/has-custom-photo/);
  expect(pageErrors).toEqual([]);
});

test("管理者は号外本文を安全に編集し、PNGとWebPを書き出せる", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await loginAdmin(page);
  await page.goto("/admin/gougai");

  const editor = page.locator("#gougai-body");
  await editor.evaluate((element) => {
    element.innerHTML = '<b>本文</b><span style="color: rgb(255, 153, 0)">強調</span><img src=x><script>alert(1)</script>';
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  const articleHtml = await page.locator(".gougai-paper .article .inner").innerHTML();
  expect(articleHtml).toContain("本文");
  expect(articleHtml).toContain('<span class="lead">強調</span>');
  expect(articleHtml).not.toMatch(/<(?:b|img|script)\b/i);

  await editor.fill("色変更");
  await editor.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.locator("#gougai-color-orange").click();
  await expect(page.locator(".gougai-paper .article .inner .lead")).toHaveText("色変更");

  await expectDownload(page, "#gougai-png", "png");
  await expectDownload(page, "#gougai-webp", "webp");
  expect(pageErrors).toEqual([]);
});

test("場内の連勝4タブは実データ更新し、ローカル確認画面は15〜18頭を保つ", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/");

  const tabs = page.locator("[data-preview-tab]");
  await expect(tabs).toHaveCount(4);
  await expect(tabs).toHaveText(["単勝", "馬連", "3連複", "馬単・3連単"]);

  await page.getByRole("tab", { name: "馬連" }).click();
  const umaren = page.locator('[data-preview-view="umaren"]');
  await expect(umaren).toBeVisible();
  await expect(umaren.locator(".odds-matrix-entry:not(.is-blank) b")).toHaveCount(3);

  await page.getByRole("tab", { name: "3連複" }).click();
  await page.locator("#sanrenpuku-axis-open").click();
  await page.locator('[data-axis-choice="2"]').click();
  await expect(page.locator(".odds-matrix-axis-number")).toHaveText("2番");
  await expect.poll(async () => page.locator('[data-preview-view="sanrenpuku"] .odds-matrix-entry:not(.is-blank) b').allTextContents())
    .toEqual(expect.arrayContaining([expect.stringMatching(/^(?:\d+\.\d|9999\.9\+)$/)]));

  await page.getByRole("tab", { name: "馬単・3連単" }).click();
  await expect(page.locator('[data-preview-view="ordered"]')).toBeVisible();
  await expect(page.locator(".odds-ordered-group")).toHaveCount(2);
  await expect(page.locator(".odds-ordered-empty")).toHaveCount(2);

  const apiCounts = await page.evaluate(async () => {
    const [pair, trio, ordered] = await Promise.all([
      fetch("/api/board?venue_view=umaren").then((response) => response.json()),
      fetch("/api/board?venue_view=sanrenpuku&axis=2").then((response) => response.json()),
      fetch("/api/board?venue_view=ordered").then((response) => response.json()),
    ]);
    return {
      pair: pair.venue.items.length,
      trio: trio.venue.items.length,
      ordered: ordered.venue.markets.map((market: { popular: unknown[]; recent: unknown[] }) => [market.popular.length, market.recent.length]),
    };
  });
  expect(apiCounts).toEqual({ pair: 3, trio: 1, ordered: [[6, 0], [6, 0]] });

  for (const runners of [15, 16, 17, 18]) {
    await page.goto(`/__local/venue-odds?runners=${runners}`);
    await expect(page.locator(`.odds-preview-runner-controls a[aria-current="page"]`)).toHaveText(`${runners}人`);
    await page.getByRole("tab", { name: "馬連" }).click();
    await expect(page.locator('[data-preview-view="umaren"] .odds-matrix-column').first()).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("窓口の連勝参考オッズは候補が多いときだけスクロール案内を出す", async ({ page }) => {
  const pageErrors = collectPageErrors(page);
  await registerMember(page, "参考オッズ案内");
  await page.route(/\/api\/board\?reference_kind=umatan/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: "voting",
        reference: {
          items: Array.from({ length: 20 }, (_, index) => ({
            label: `1→${index + 2}`,
            odds: index + 10.5,
          })),
        },
      }),
    });
  });
  await page.goto("/bet?kind=umatan");
  await page.getByRole("button", { name: /E2E開催に参加/ }).click();
  await page.locator("#board [data-n]").first().click();

  const reference = page.locator("#reference-odds");
  const body = page.locator("#reference-odds-body");
  const hint = page.locator(".reference-odds-scroll-hint");
  await expect(reference).toBeVisible();
  await expect(reference).toHaveClass(/is-scrollable/);
  await expect(hint).toHaveCSS("opacity", "1");
  await body.evaluate((element) => {
    element.scrollTop = 12;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(reference).toHaveClass(/is-scrolled/);
  await expect(hint).toHaveCSS("opacity", "0");
  expect(pageErrors).toEqual([]);
});
