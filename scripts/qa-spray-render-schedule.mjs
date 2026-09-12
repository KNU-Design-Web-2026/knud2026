// Real browser scheduling QA. This verifies lifecycle behavior, not CPU/GPU performance.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = resolve(process.env.SPRAY_QA_OUTPUT || "artifacts/spray-render-schedule");
const url = process.env.SPRAY_QA_URL || "http://localhost:3002";
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1350, height: 900 } });
await context.addInitScript(() => {
  window.__sprayClearCount = 0;
  const original = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas.closest?.("#main-hero")) window.__sprayClearCount += 1;
    return original.apply(this, args);
  };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

const clearCount = () => page.evaluate(() => window.__sprayClearCount);
const visiblePixels = () => page.locator("#main-hero canvas").evaluate((canvas) => {
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  let pixels = 0;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] > 16) pixels += 1;
  }
  return pixels;
});

try {
  await page.goto(url);
  const zone = page.locator("#main-spray-zone");
  await zone.waitFor();
  await page.waitForTimeout(700);
  const bounds = await zone.boundingBox();
  assert.ok(bounds, "spray zone must be visible");

  const beforePaint = await clearCount();
  await page.mouse.click(bounds.x + bounds.width * 0.32, bounds.y + Math.min(300, bounds.height * 0.4));
  await page.waitForFunction((baseline) => window.__sprayClearCount > baseline, beforePaint);
  await page.waitForTimeout(200);
  const painted = { clears: await clearCount(), pixels: await visiblePixels() };
  assert.ok(painted.pixels > 0, "a click must deposit visible paint");

  await page.waitForTimeout(1_000);
  const opaqueIdle = { clears: await clearCount(), pixels: await visiblePixels() };
  assert.equal(opaqueIdle.clears, painted.clears, "opaque paint must not redraw while visually unchanged");
  assert.equal(opaqueIdle.pixels, painted.pixels, "sleeping must preserve the deposited paint");
  await page.screenshot({ path: `${output}/01-opaque-idle.png` });

  await page.waitForTimeout(4_500);
  const fading = { clears: await clearCount(), pixels: await visiblePixels() };
  assert.ok(fading.clears > opaqueIdle.clears + 2, "the renderer must wake and animate the fade");
  assert.ok(fading.pixels > 0, "paint must still be visible during fade");
  await page.screenshot({ path: `${output}/02-fading.png` });

  await page.waitForTimeout(1_200);
  const expired = { clears: await clearCount(), pixels: await visiblePixels() };
  assert.equal(expired.pixels, 0, "expired paint must be cleared");
  await page.waitForTimeout(300);
  const settled = { clears: await clearCount(), pixels: await visiblePixels() };
  assert.equal(settled.clears, expired.clears, "an empty canvas must stop requesting frames");
  assert.deepEqual(errors, []);

  const results = { url, beforePaint, painted, opaqueIdle, fading, expired, settled, errors };
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ output, ...results }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
