import { expect, test } from "@playwright/test";

const firstPhotos = ["032", "033", "034", "036", "039", "040"];

test("Archive stays staggered from the first photo to the last without changing reading order", async ({ page }, testInfo) => {
  await page.goto("/space");
  const archive = page.getByRole("region", { name: "Archive" });
  const photos = archive.getByRole("img");
  await expect(photos).toHaveCount(79);

  const cards = await photos.evaluateAll(elements =>
    elements.map(element => {
      const image = element as HTMLImageElement;
      const bounds = image.getBoundingClientRect();
      return {
        id: image.getAttribute("src")?.match(/\/(\d+)-/)?.[1],
        width: bounds.width,
        height: bounds.height,
        left: bounds.left,
        top: bounds.top,
        fit: getComputedStyle(image).objectFit,
      };
    }),
  );
  expect(cards.slice(0, 6).map(card => card.id)).toEqual(firstPhotos);
  expect(cards.at(-1)?.id).toBe("153");
  expect(new Set(cards.map(card => card.id)).size).toBe(79);
  expect(cards.map(card => Number(card.id))).toEqual(cards.map(card => Number(card.id)).sort((a, b) => a - b));

  const columns = testInfo.project.name === "mobile" ? 2 : 3;
  const firstRow = cards.slice(0, columns);
  expect(firstRow.every(card => card.top === firstRow[0].top)).toBeTruthy();
  expect(firstRow.every((card, index) => index === 0 || card.left > firstRow[index - 1].left)).toBeTruthy();
  expect(cards[columns].top).toBeGreaterThan(firstRow[0].top);
  expect(cards[0].width / cards[0].height).toBeCloseTo(1.23, 1);
  expect(cards[1].width / cards[1].height).toBeGreaterThan(1.65);
  expect(cards[0].height / cards[0].width - cards[1].height / cards[1].width).toBeGreaterThan(0.2);
  expect(cards[columns].top).toBeLessThan(cards[0].top + cards[0].height);
  expect(cards.slice(0, 12).every(card => card.fit === "cover")).toBeTruthy();

  const openingBottom = Math.max(...cards.slice(0, 12).map(card => card.top + card.height));
  expect(cards[12].top).toBeLessThan(openingBottom);

  for (const section of [cards.slice(12, 35), cards.slice(35, 58), cards.slice(58)]) {
    const ratios = new Set(section.map(card => Math.round(10 * card.height / card.width)));
    expect(ratios.size).toBeGreaterThanOrEqual(4);
    expect(section.some((card, i) => i > 0 && card.top < section[i - 1].top + section[i - 1].height)).toBeTruthy();
  }
  expect(cards.every((card, i) => i === 0 || card.top >= cards[i - 1].top)).toBeTruthy();
  const columnBottoms = new Map<number, number>();
  for (const card of cards) {
    expect(card.top).toBeGreaterThanOrEqual(columnBottoms.get(card.left) ?? firstRow[0].top);
    columnBottoms.set(card.left, card.top + card.height);
  }
  expect(columnBottoms.size).toBe(columns);

  for (const id of ["111", "138"]) {
    expect(cards.find(card => card.id === id)?.fit).toBe("contain");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("Archive requests nearby thumbnails and only opens the full-size copy on activation", async ({ context, page }) => {
  const requested = new Set<string>();
  context.on("request", request => {
    if (request.url().includes("/assets/archive-2026/")) requested.add(request.url());
  });
  await page.goto("/space");
  const archive = page.getByRole("region", { name: "Archive" });
  const first = archive.getByRole("link").first();
  await first.scrollIntoViewIfNeeded();
  const image = first.getByRole("img");
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(requested.size).toBeGreaterThan(0);
  expect(requested.size).toBeLessThan(79);
  expect(Array.from(requested).some(url => url.endsWith("-full.webp"))).toBeFalsy();

  await first.focus();
  const [full] = await Promise.all([context.waitForEvent("page"), first.press("Enter")]);
  await full.waitForLoadState("load");
  await expect(full).toHaveURL(/\/assets\/archive-2026\/032-full\.webp$/);
  await expect.poll(() => full.locator("img").evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(2048);
  expect(await full.locator("img").evaluate(node => (node as HTMLImageElement).naturalHeight)).toBe(1365);
});
