import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.HERO_QA_OUTPUT || '/tmp/knud-eye-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  for (const width of [1920, 1350, 1020, 600, 400]) {
    await page.setViewportSize({ width, height: 980 });
    for (const [time, closed] of [[0, false], [1792, true], [2016, false], [4928, true], [5208, true], [5400, false]]) {
      const state = await page.evaluate((time) => {
        const scene = [...document.querySelectorAll('.hero-scene')].find(el => getComputedStyle(el).display !== 'none');
        const eye = scene.querySelector('.hero-eyelid');
        if (!eye) return null;
        for (const a of document.querySelector('.hero-motion').getAnimations({subtree:true})) { a.pause(); a.currentTime = time; }
        return getComputedStyle(eye).transform;
      }, time);
      assert.ok(state, 'responsive scene must have an eyelid');
      const scaleY = Number(state.match(/matrix\(([^)]+)\)/)[1].split(',')[3]);
      assert.ok(closed ? scaleY > .95 : scaleY < .05, `${width} ${time}: ${state}`);
      if ([1350, 400].includes(width) && [0,1792].includes(time)) await page.screenshot({path:`${output}/${width}-${time}.png`});
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.hero-eyelid').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  console.log('PASS: five viewports, anticipation blink, double blink, reduced motion');
} finally { await browser.close(); }
