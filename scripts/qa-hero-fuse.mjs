// Visual/functional QA; fixed animation times below are not performance samples.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = resolve(process.env.HERO_QA_OUTPUT || "artifacts/hero-fuse");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1350, height: 900 }, recordVideo: { dir: output } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const results = [];
try {
  await page.goto(process.env.HERO_QA_URL || "http://localhost:3000");
  await page.locator('.hero-motion[data-running="true"]').waitFor();
  await page.waitForTimeout(6000); // Record one natural, unmodified cycle first.
  for (const width of [1920, 1350, 1020, 600, 400]) {
    await page.setViewportSize({ width, height: width <= 600 ? 980 : 900 });
    await page.waitForTimeout(100);
    for (const time of [0, 750, 1400, 1880, 2050, 3600]) {
      const state = await page.evaluate((time) => {
        const root = document.querySelector(".hero-motion");
        for (const animation of root.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = time;
        }
        const scene = [...root.querySelectorAll(".hero-scene")].find((node) => getComputedStyle(node).display !== "none");
        const style = (selector) => getComputedStyle(scene.querySelector(selector));
        return {
          width: document.documentElement.scrollWidth,
          flamePaths: scene.querySelectorAll(".hero-flame-flicker path").length,
          duration: style(".hero-fuse-erase").animationDuration,
          dash: style(".hero-fuse-erase").strokeDasharray,
          travel: style(".hero-fuse-spark").offsetDistance,
          opacity: style(".hero-fuse-spark").opacity,
          shrink: style(".hero-flame-size").transform,
          lion: style(".hero-lion").transform,
          burst: style(".hero-burst-2").transform,
        };
      }, time);
      assert.equal(state.duration, "5.6s");
      assert.equal(state.flamePaths, 4);
      assert.ok(state.width <= width, "no horizontal overflow");
      if (time === 1400) {
        assert.ok(parseFloat(state.travel) > 60 && parseFloat(state.travel) < 75);
        assert.equal(state.opacity, "1");
        assert.ok(Math.abs(parseFloat(state.dash) - parseFloat(state.travel)) < 1, "burn front follows the moving flame");
        const scale = Number(state.shrink.match(/matrix\(([^,]+)/)[1]);
        assert.ok(scale > 0.6 && scale < 0.85, "original flame shrinks during consumption");
      }
      if (time === 2050) {
        assert.equal(state.opacity, "0");
        const matrix = state.burst.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number);
        const scale = Math.hypot(matrix[0], matrix[1]);
        assert.ok(width > 600 ? scale > 1.32 : scale > 1.15 && scale < 1.28,
          `impact must be bold on desktop and restrained on mobile: ${width}, ${scale}`);
      }
      results.push({ width, time, ...state });
      if ([1350, 400].includes(width) || time === 1400) {
        await page.screenshot({ path: `${output}/${width}-${time}.png` });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".hero-motion").evaluate((root) => root.getAnimations({ subtree: true }).length), 0);
  await page.screenshot({ path: `${output}/400-reduced.png` });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, reducedMotion: "pass" }, null, 2));
  console.log(`PASS: ${results.length} stages across 5 viewports, reduced motion; ${output}`);
} finally {
  await context.close();
  await browser.close();
}
