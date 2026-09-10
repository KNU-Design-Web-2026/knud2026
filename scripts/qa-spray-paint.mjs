// Run with PLAYWRIGHT_MODULE pointing at an installed Playwright module.
// This is visual/functional QA, not a controlled performance benchmark.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = resolve(process.env.SPRAY_QA_OUTPUT || "artifacts/spray-paint");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1350, height: 900 }, deviceScaleFactor: 1, recordVideo: { dir: output, size: { width: 1350, height: 900 } } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = process.env.SPRAY_QA_URL || "http://localhost:3002";

async function inkBounds() {
  return page.locator("#main-hero canvas").evaluate((canvas) => {
    const { width, height } = canvas;
    const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    let pixels = 0, bottom = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 16) { pixels++; bottom = y; }
    }
    return { pixels, bottom };
  });
}

const results = [];
try {
  await page.goto(url);
  await page.locator("#main-spray-zone").waitFor();
  await page.waitForTimeout(700);
  for (const width of [1350, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const zone = await page.locator("#main-spray-zone").boundingBox();
    const x = Math.round(width * 0.3), y = Math.round(zone.y + 200);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(80);
    const early = await inkBounds();
    await page.screenshot({ path: `${output}/${width}-01-fresh.png` });
    await page.waitForTimeout(850);
    const flowing = await inkBounds();
    assert.ok(flowing.bottom > early.bottom + 15, `${width}: drip must extend downwards`);
    await page.screenshot({ path: `${output}/${width}-02-drip.png` });
    await page.mouse.up();
    await page.waitForTimeout(2500);
    assert.equal((await inkBounds()).pixels, 0, "released paint must expire");

    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let step = 1; step <= 45; step++) {
      await page.mouse.move(x + step * 4, y + Math.sin(step / 9) * 36);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(320);
    await page.mouse.up();
    await page.screenshot({ path: `${output}/${width}-03-stroke.png` });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${output}/${width}-04-stroke-drips.png` });
    await page.screenshot({ path: `${output}/${width}-detail.png`, clip: { x: x - 70, y: y - 100, width: 390, height: 260 } });
    results.push({ width, early, flowing, expiry: "pass" });
    await page.waitForTimeout(2600);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.mouse.move(700, 300, { steps: 20 });
  await page.mouse.up();
  assert.equal((await inkBounds()).pixels, 0, "reduced motion disables painting");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.waitForTimeout(100);
  assert.ok((await inkBounds()).pixels > 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // matchMedia change is delivered asynchronously, after the emulation command.
  await page.waitForFunction(() => {
    const canvas = document.querySelector("#main-hero canvas");
    return !canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
  });
  assert.equal((await inkBounds()).pixels, 0, "preference changes clear live paint");
  await page.mouse.up();
  const mobile = await browser.newContext({ viewport: { width: 400, height: 880 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url);
  await mobilePage.waitForTimeout(500);
  await mobilePage.touchscreen.tap(180, 320);
  await mobilePage.screenshot({ path: `${output}/400-mobile.png` });
  assert.equal(await mobilePage.locator("#main-hero canvas").evaluate((canvas) => canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)), false);
  await mobile.close();
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ url, results, reducedMotion: "pass", touch: "pass", errors, note: "Functional/visual QA only; not a performance baseline." }, null, 2));
  console.log(JSON.stringify({ output, results, reducedMotion: "pass", touch: "pass" }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
