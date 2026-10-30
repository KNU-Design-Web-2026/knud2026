import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const dir = "artifacts/space-preview/visual";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [400, 822, 1020, 1350, 1920, 2560]) {
    const captures = [];
    for (const [label, port] of [["baseline", 3101], ["candidate", 3102]]) {
      const page = await browser.newPage({ viewport: { width, height: 1400 }, deviceScaleFactor: 1 });
      await page.goto(`http://127.0.0.1:${port}/space`);
      await page.evaluate(() => document.fonts.ready);
      if (width >= 822) {
        await page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ }).focus();
        await page.locator('#space-project-preview[data-image-state="ready"]').waitFor();
      }
      // Real transitions complete; no masks or motion disabling.
      await page.waitForTimeout(400);
      const path = `${dir}/${label}-${width}.png`;
      await page.screenshot({ path, fullPage: true });
      captures.push(await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
      await page.close();
    }
    const [a, b] = captures;
    let changedPixels = 0;
    if (a.info.width !== b.info.width || a.info.height !== b.info.height) throw new Error(`Dimensions differ at ${width}`);
    for (let i = 0; i < a.data.length; i += 4) {
      if (a.data.subarray(i, i + 4).compare(b.data.subarray(i, i + 4)) !== 0) changedPixels++;
    }
    results.push({ width, height: a.info.height, changedPixels, totalPixels: a.info.width * a.info.height });
    console.log(results.at(-1));
  }
  await writeFile(`${dir}/comparison.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
