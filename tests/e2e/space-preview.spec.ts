import { expect, test, type Locator } from "@playwright/test";

// toBeVisible deliberately ignores opacity; inspect ancestor opacity as well.
async function effectiveOpacity(locator: Locator) {
  return locator.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (css.visibility === "hidden" || css.display === "none") return 0;
      opacity *= Number(css.opacity);
    }
    return opacity;
  });
}

test("이미지 응답을 기다리는 동안에도 선택한 작품 정보를 확인한다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "터치는 미리보기 대신 상세로 이동한다");
  await page.route("**/_next/image?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("url")?.includes("/yoon-iji/space.webp")) {
      await new Promise((resolve) => setTimeout(resolve, 8_000));
    }
    await route.continue();
  });
  await page.goto("/space");
  const booth = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
  await booth.hover();
  const preview = page.locator("#space-project-preview");
  await expect(preview).toHaveAttribute("data-open", "true");
  await expect(preview).toHaveAttribute("data-image-state", "loading");
  await expect.poll(() => effectiveOpacity(preview.locator("h3")), { timeout: 1_000 }).toBe(1);
  await expect(preview.locator("h3")).toHaveText("3et");
  await expect(preview.getByText("윤이지", { exact: true })).toBeVisible();
  await expect(preview.locator('[style*="data:image/"]')).toHaveCount(1);
  await expect(preview.getByRole("status")).toHaveCount(0);
  await expect(preview.getByRole("status")).toHaveText("고화질 이미지 불러오는 중", { timeout: 3_000 });
  await expect(preview).toHaveAttribute("data-image-state", "loading");
  await expect(preview.getByRole("status")).toBeVisible();
  if (info.project.name === "chromium") await page.screenshot({ path: "artifacts/space-preview/pending.png", fullPage: true });
  await booth.click();
  await expect(page).toHaveURL(/\/work\/12$/);
});

test("실패해도 작품 정보는 유지되고 포인터로 명시적 재시도가 가능하다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  let attempts = 0;
  await page.route("**/_next/image?**", async route => {
    if (new URL(route.request().url()).searchParams.get("url")?.includes("/yoon-iji/space.webp") && ++attempts === 1) await route.abort("failed");
    else await route.continue();
  });
  await page.goto("/space");
  await page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ }).hover();
  const preview = page.locator("#space-project-preview");
  await expect(preview).toHaveAttribute("data-image-state", "error");
  await expect.poll(() => effectiveOpacity(preview.locator("h3"))).toBe(1);
  if (info.project.name === "chromium") await preview.screenshot({ path: "artifacts/space-preview/error.png" });
  await preview.getByRole("button", { name: "다시 불러오기" }).click();
  await expect(preview).toHaveAttribute("data-open", "true");
  await expect(preview).toHaveAttribute("data-image-state", "ready");
  expect(attempts).toBe(2);
});

test("키보드로 재시도에 접근하고 Escape와 Tab으로 빠져나간다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  await page.route("**/_next/image?**", async route => {
    if (new URL(route.request().url()).searchParams.get("url")?.includes("/yoon-iji/space.webp")) await route.abort("failed");
    else await route.continue();
  });
  await page.goto("/space");
  const owner = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
  await owner.focus();
  const preview = page.locator("#space-project-preview");
  await expect(preview).toHaveAttribute("data-image-state", "error");
  await page.keyboard.press("Tab");
  await expect(preview.getByRole("button")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(owner).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(preview).toHaveAttribute("data-open", "false");
  await expect(owner).toBeFocused();
  await owner.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(owner).not.toBeFocused();
});

test("늦은 이전 작품의 완료가 현재 선택한 작품을 덮어쓰지 않는다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  await page.route("**/_next/image?**", async route => {
    const src = new URL(route.request().url()).searchParams.get("url") ?? "";
    if (src.includes("/yoon-iji/space.webp")) await new Promise(resolve => setTimeout(resolve, 1_500));
    await route.continue();
  });
  await page.goto("/space");
  const a = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
  const b = page.getByRole("link", { name: /^김서은 .*작품 정보 보기$/ });
  await a.focus();
  await b.focus();
  const preview = page.locator("#space-project-preview");
  await expect(preview.locator("h3")).toHaveText("REBLOOM");
  await expect(preview).toHaveAttribute("data-image-state", "ready");
  await page.waitForTimeout(1_700); // Let the deliberately late A response arrive.
  await expect(preview.locator("h3")).toHaveText("REBLOOM");
  await expect(preview.locator("img")).toHaveAttribute("src", /kim-seoeun/);
  await a.focus();
  await expect(preview.locator("h3")).toHaveText("3et");
  await expect(preview).toHaveAttribute("data-image-state", "ready");
});

test("키보드 재시도 실행 후에도 초점과 Escape 동작을 유지한다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  let attempts = 0;
  await page.route("**/_next/image?**", async route => {
    if (new URL(route.request().url()).searchParams.get("url")?.includes("/yoon-iji/space.webp")) {
      if (++attempts === 1) { await route.abort("failed"); return; }
      await new Promise(resolve => setTimeout(resolve, 4_000));
    }
    await route.continue();
  });
  await page.goto("/space");
  const owner = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
  await owner.focus();
  const preview = page.locator("#space-project-preview");
  await expect(preview).toHaveAttribute("data-image-state", "error");
  await page.keyboard.press("Tab");
  await expect(preview.getByRole("button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(preview).toHaveAttribute("data-image-state", "loading");
  await expect(owner).toBeFocused({ timeout: 1_000 });
  await page.keyboard.press("Escape");
  await expect(preview).toHaveAttribute("data-open", "false");
  // macOS WebKit defaults to skipping links with plain Tab; Option+Tab is
  // its native link traversal. Do not change the user's OS preference.
  await page.keyboard.press(info.project.name === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: /^조장원 .*작품 정보 보기$/ })).toBeFocused();
});

test("터치에서는 미리보기를 열지 않고 작품 상세로 이동한다", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/space");
  await page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ }).tap();
  await expect(page).toHaveURL(/\/work\/12$/);
});

test("이미지 실패 카드가 어떤 작품의 원래 링크도 가리지 않는다", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  await page.setViewportSize({ width: 1920, height: 1600 });
  await page.route("**/_next/image?**", route => route.abort("failed"));
  await page.goto("/space");
  const links = page.getByRole("link", { name: /작품 정보 보기$/ });
  for (const owner of await links.all()) {
    await owner.focus();
    await expect(page.locator("#space-project-preview")).toHaveAttribute("data-image-state", "error");
    expect(await owner.evaluate(node => {
      const r = node.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("a") === node;
    })).toBe(true);
  }
  const owner = page.getByRole("link", { name: /^이초원 .*작품 정보 보기$/ });
  await owner.hover();
  await expect(page.locator("#space-project-preview")).toHaveAttribute("data-image-state", "error");
  const rect = await owner.boundingBox();
  await page.mouse.click(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2);
  await expect(page).toHaveURL(/\/work\/15$/);
});

for (const width of [360, 400, 600, 821, 822, 1020, 1350, 1920, 2560]) {
  test(`${width}px에서 모든 작품 링크와 가로 레이아웃을 유지한다`, async ({ page }, info) => {
    test.skip(info.project.name !== "chromium");
    await page.setViewportSize({ width, height: 1080 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/space");
    const links = page.getByRole("link", { name: /작품 정보 보기$/ });
    await expect(links).toHaveCount(19);
    expect(await links.evaluateAll(nodes => new Set(nodes.map(n => n.getAttribute("href"))).size)).toBe(19);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width >= 822) {
      await links.first().focus();
      await expect(page.locator("#space-project-preview")).toHaveAttribute("data-open", "true");
      await expect.poll(() => effectiveOpacity(page.locator("#space-project-preview h3"))).toBe(1);
    }
  });
}
