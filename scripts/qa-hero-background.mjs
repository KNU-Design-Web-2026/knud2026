// Layout evidence only; not a performance measurement.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.HERO_QA_OUTPUT || '/tmp/knud-hero-background';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const results = [];
  for (const width of [400, 600, 601, 768, 820, 834, 1020]) {
    await page.setViewportSize({ width, height: 1366 });
    await page.goto(process.env.HERO_QA_URL || 'http://localhost:3000');
    const state = await page.evaluate(() => {
      const hero = document.querySelector('#main-hero');
      const scene = [...document.querySelectorAll('.hero-scene')].find(el => getComputedStyle(el).display !== 'none');
      const svg = scene.querySelector('svg');
      return {
        background: getComputedStyle(hero).backgroundColor,
        gradientEnds: [...svg.querySelectorAll('linearGradient stop:last-child')].map(el => el.getAttribute('stop-color')),
        heroBottom: hero.getBoundingClientRect().bottom,
        sceneBottom: scene.getBoundingClientRect().bottom,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    assert.equal(state.background, 'rgb(0, 26, 39)', `width ${width}: hero must continue the SVG end color`);
    assert.ok(state.gradientEnds.includes('#001A27'));
    assert.ok(state.scrollWidth <= width);
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    results.push({ width, ...state });
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log('PASS: 7 mobile/tablet widths, gradient end color and horizontal overflow');
} finally { await browser.close(); }
