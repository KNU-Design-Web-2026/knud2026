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
    for (const time of [0, 335, 337, 500, 750, 1100, 1250, 1400, 1880, 2050, 2800, 3600]) {
      const state = await page.evaluate((time) => {
        const root = document.querySelector(".hero-motion");
        for (const animation of root.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = time;
        }
        const scene = [...root.querySelectorAll(".hero-scene")].find((node) => getComputedStyle(node).display !== "none");
        const style = (selector) => getComputedStyle(scene.querySelector(selector));
        const spark = scene.querySelector('.hero-fuse-spark');
        const erase = scene.querySelector('.hero-fuse-erase');
        const core = scene.querySelector('.hero-hot-core');
        const progress = parseFloat(style('.hero-fuse-spark').offsetDistance) / 100;
        const point = erase.getPointAtLength(erase.getTotalLength() * progress);
        const at = erase.getTotalLength() * progress;
        const before = erase.getPointAtLength(Math.max(0, at - .5));
        const after = erase.getPointAtLength(Math.min(erase.getTotalLength(), at + .5));
        const angle = Math.atan2(after.y-before.y, after.x-before.x);
        const rope = scene.querySelector('[id$="-Vector_19"]');
        const inside = (distance) => rope.isPointInFill(new DOMPoint(point.x - Math.sin(angle)*distance, point.y + Math.cos(angle)*distance));
        const edge = (sign) => { let distance = 0; while(distance < 80 && inside(sign*distance)) distance += .5; return distance; };
        const boundary = new DOMPoint(point.x, point.y).matrixTransform(spark.parentNode.getScreenCTM());
        const flameRoot = core ? new DOMPoint(0, 0).matrixTransform(core.getScreenCTM()) : null;
        return {
          contactGap: flameRoot ? Math.hypot(boundary.x-flameRoot.x, boundary.y-flameRoot.y) : Infinity,
          ropeCenterError: Math.abs(edge(1)-edge(-1)),
          insideRope: inside(0),
          width: document.documentElement.scrollWidth,
          flamePaths: scene.querySelectorAll(".hero-flame-flicker path").length,
          duration: style(".hero-fuse-erase").animationDuration,
          dash: style(".hero-fuse-erase").strokeDasharray,
          travel: style(".hero-fuse-spark").offsetDistance,
          opacity: style(".hero-fuse-spark").opacity,
          shrink: style(".hero-flame-size").transform,
          flicker: style(".hero-flame-flicker").transform,
          rotation: style(".hero-fuse-spark").offsetRotate,
          embers: scene.querySelectorAll('.hero-ember').length,
          heat: style('.hero-flame-size').filter,
          emberRotation: scene.querySelector('.hero-ember-trail') ? style('.hero-ember-trail').offsetRotate : null,
          upwardEmbers: [...scene.querySelectorAll('.hero-ember')].every(el => parseFloat(getComputedStyle(el).getPropertyValue('--ember-y')) < 0),
          contact: scene.querySelectorAll('.hero-burn-contact').length,
          fittedFlames: scene.querySelectorAll('.hero-flame-fit').length,
          initialErase: style('.hero-fuse-tip-erase').opacity,
          prematureStripeMasks: scene.querySelectorAll('.hero-tip-details-erase[fill="black"]').length,
          effectsBehindBody: (() => {
            const effects = scene.querySelector('.hero-fuse-effects');
            const siblings = [...effects.parentNode.children];
            return siblings.indexOf(effects) === 1 && siblings[0].classList.contains('hero-fuse') && effects.querySelectorAll('.hero-paint-fleck').length === 6;
          })(),
          lion: style(".hero-lion").transform,
          burst: style(".hero-burst-2").transform,
        };
      }, time);
      assert.equal(state.duration, "5.6s");
      assert.equal(state.flamePaths, 4);
      assert.equal(state.prematureStripeMasks, 0, 'do not erase intact stripes ahead of the moving burn front');
      assert.equal(state.effectsBehindBody, true, 'flame, embers and final flecks render behind the torso');
      if ([0, 335].includes(time)) {
        assert.equal(state.initialErase, '0', 'original fuse must remain intact before ignition');
        assert.equal(state.opacity, '0', 'moving flame must not overlap the original before ignition');
      }
      if (time === 337) assert.equal(state.opacity, '1');
      if (time === 2800) assert.equal(state.opacity, '0', 'no flame remains after combustion');
      assert.equal(state.emberRotation, '0deg', 'embers rise independently of fuse rotation');
      assert.ok(state.upwardEmbers, 'all embers travel upward');
      assert.equal(state.contact, 1, 'burn front has a local glowing contact');
      assert.equal(state.fittedFlames, 1, 'flame width must be fitted separately from its pulse');
      assert.ok(state.contactGap < 1, `flame root stays attached to burn boundary: ${state.contactGap}px`);
      assert.match(state.rotation, /^auto /, 'flame follows the curve tangent');
      assert.ok(Math.abs(parseFloat(state.rotation.replace('auto ', '')) - 64.98) < .1, 'preserve the original ignition orientation');
      assert.equal(state.embers, 6);
      assert.ok(state.width <= width, "no horizontal overflow");
      if (time === 1400) {
        assert.ok(parseFloat(state.travel) > 60 && parseFloat(state.travel) < 75);
        assert.equal(state.opacity, "1");
        assert.ok(Math.abs(parseFloat(state.dash) - parseFloat(state.travel)) < 1, "burn front follows the moving flame");
        const scale = Number(state.shrink.match(/matrix\(([^,]+)/)[1]);
        assert.ok(scale >= 1.03 && scale <= 1.16, "flame stays near the original size throughout consumption");
      }
      if ([750, 1100, 1250, 1400, 1880].includes(time)) {
        assert.ok(state.insideRope, 'burn centre must be inside original rope');
        assert.ok(state.ropeCenterError < 10, `burn centre must not run along a rope edge: ${state.ropeCenterError}`);
        for (const transform of [state.shrink, state.flicker]) {
          const values = transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
          assert.equal(values[1], 0, 'no sideways rotation on top of path rotation');
          assert.equal(values[2], 0, 'no sideways rotation on top of path rotation');
        }
        const scale = Number(state.shrink.match(/matrix\(([^,]+)/)[1]);
        assert.ok(scale >= 1.03 && scale <= 1.16);
      }
      if (time === 2050) {
        assert.equal(state.opacity, "0");
        const matrix = state.burst.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number);
        const scale = Math.hypot(matrix[0], matrix[1]);
        assert.ok(width > 600 ? scale > 1.32 : scale > 1.15 && scale < 1.28,
          `impact must be bold on desktop and restrained on mobile: ${width}, ${scale}`);
      }
      if (time === 1880) assert.ok(Number(state.heat.match(/brightness\(([^)]+)\)/)[1]) > 1.1, 'heat increases before impact');
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
