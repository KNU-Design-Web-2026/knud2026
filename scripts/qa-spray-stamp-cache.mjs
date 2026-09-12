// Real Canvas integration, not a performance benchmark. Reference comes from pre-cache git code.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = resolve(process.env.SPRAY_QA_OUTPUT || "artifacts/spray-stamp-cache");
await mkdir(output, { recursive: true });
const modules = {};
for (const name of ["spray-paint", "spray-texture", "spray-stamp-groups", "spray-renderer"]) {
  const source = await readFile(new URL(`../src/components/main/${name}.ts`, import.meta.url), "utf8");
  modules[`/${name}.js`] = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
    .replace(/from "\.\/(spray-[^"]+)"/g, 'from "./$1.js"');
}
const old = execFileSync("git", ["show", "b322f9b:src/components/main/spray-canvas.tsx"], { encoding: "utf8" });
const loop = old.slice(old.indexOf("      for (const stamp of stamps) {"), old.indexOf("      frame = pointerId"));
assert.ok(loop.includes("context.ellipse") && loop.includes("context.globalAlpha = 1"));
modules["/reference.js"] = `import {getPaintOpacity,getDripProgress,TEXTURE_HALF_SIZE,TEXTURE_RADIUS_X,TEXTURE_RADIUS_Y} from './spray-paint.js'; export function drawReference(context,stamps,now,textureCache){${loop}}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.route("http://spray.test/**", route => route.fulfill({ contentType: route.request().url().endsWith(".js") ? "text/javascript" : "text/html", body: modules[new URL(route.request().url()).pathname] || "<style>canvas{width:480px}body{background:#0cacf2}</style>" }));
  await page.goto("http://spray.test/");
  const results = await page.evaluate(async () => {
    const { createPaintStamp, createPaintDrip } = await import("/spray-paint.js");
    const { createSprayTextureCache } = await import("/spray-texture.js");
    const { createSprayRenderer } = await import("/spray-renderer.js");
    const { drawReference } = await import("/reference.js");
    const assert = (ok, message) => { if (!ok) throw new Error(message); };
    const results = [];
    for (const preferImageBitmap of [false, true]) for (const dpr of [1, 1.5, 2]) {
      let seed = 42;
      const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
      const colors = ["#F8D622", "#FF3030", "#F7F7F2", "#FD9519", "#41C9F9"];
      const stamps = Array.from({ length: 192 }, (_, i) => {
        const stamp = createPaintStamp({ x: 40 + random() * 400, y: 40 + random() * 180 }, i * 2, random() * Math.PI * 2, colors[Math.floor(i / 20) % 5], random);
        stamp.density = 0.58 + random() * 0.42;
        return stamp;
      });
      const make = () => { const c = document.createElement("canvas"); c.width = 480 * dpr; c.height = 320 * dpr; return c; };
      const a = make(), b = make(), ac = a.getContext("2d"), bc = b.getContext("2d");
      const textures = createSprayTextureCache({ preferImageBitmap });
      if (preferImageBitmap) {
        for (const stamp of stamps) textures.get(stamp);
        const deadline = performance.now() + 10000;
        while (!stamps.every(stamp => textures.get(stamp) instanceof ImageBitmap)) {
          assert(performance.now() < deadline, "ImageBitmap warmup timed out");
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      const renderer = createSprayRenderer(bc, textures);
      const checks = [];
      const compare = (now, input = stamps) => {
        ac.setTransform(dpr, 0, 0, dpr, 0, 0); ac.clearRect(0, 0, 480, 320);
        drawReference(ac, input, now, textures);
        const stats = renderer.render(input, now, 480, 320, dpr);
        const x = ac.getImageData(0, 0, a.width, a.height).data, y = bc.getImageData(0, 0, b.width, b.height).data;
        let max = 0, sum = 0, visible = 0;
        // Compare composited channels on both light and dark backgrounds: raw RGB in nearly transparent pixels is unstable.
        for (let i = 0; i < x.length; i += 4) {
          if (x[i + 3]) visible++;
          for (const bg of [0, 255]) for (let channel = 0; channel < 3; channel++) {
            const p = x[i + channel] * x[i + 3] / 255 + bg * (1 - x[i + 3] / 255);
            const q = y[i + channel] * y[i + 3] / 255 + bg * (1 - y[i + 3] / 255);
            const diff = Math.abs(p - q); max = Math.max(max, diff); sum += diff;
          }
        }
        const mean = sum / (a.width * a.height * 6);
        checks.push({ now, max, mean, visible, ...stats });
        assert(max <= 6 && mean <= 0.25, `Visual regression DPR${dpr} time${now}: max=${max} mean=${mean}`);
        return stats;
      };
      const initial = compare(1000);
      assert(initial.dirtyTiles > 0 && initial.incrementalStamps === 0,
        "First render must clear unknown destination pixels before drawing");
      const reused = compare(1100);
      assert(reused.cachedGroups === 6 && reused.bakedStamps === 0 && reused.individualStamps === 0, "Unchanged frame must reuse six groups without rebaking 192 stamps");
      assert(reused.dirtyTiles === 0 && reused.clearedPixels === 0 && reused.drawnGroups === 0,
        "Unchanged pixels must not be cleared or composited again");
      assert(reused.cacheBytes <= 16 * 1024 * 1024, "Cache exceeds pixel budget");
      stamps[40].drip = createPaintDrip(stamps[40], 1100, random);
      const dynamic = compare(1500);
      assert(dynamic.cachedGroups === 5 && dynamic.individualStamps === 32, "New drip must invalidate only its group");
      assert(dynamic.dirtyTiles > 0 && dynamic.clearedPixels < a.width * a.height,
        "A changing drip must invalidate only intersecting tiles, not the full canvas");
      assert(dynamic.redrawnStamps <= dynamic.individualStamps,
        "Individual fallback must not redraw stamps outside dirty tiles");
      compare(2200);
      compare(5401); compare(5600); compare(6000); compare(6600, stamps.filter(s => 6600 - s.createdAt < 6600));
      const expired = compare(7100, []);
      assert(expired.cacheBytes === 0 && checks.at(-1).visible === 0, "Expired groups must release buffers and disappear");
      renderer.clear(); compare(1000, stamps.filter(s => !s.drip)); renderer.clear();
      // Zero-budget path is the same renderer with caching unavailable.
      const fallback = createSprayRenderer(bc, textures, { maxCacheBytes: 0 });
      assert(fallback.render(stamps, 1500, 480, 320, dpr).individualStamps === stamps.length, "Budget exhaustion must fall back");
      ac.setTransform(dpr, 0, 0, dpr, 0, 0); ac.clearRect(0, 0, 480, 320); drawReference(ac, stamps, 1500, textures);
      const samePixels = () => {
        const x = ac.getImageData(0, 0, a.width, a.height).data, y = bc.getImageData(0, 0, b.width, b.height).data;
        return x.every((v, i) => v === y[i]);
      };
      assert(samePixels(), "Fallback must exactly match original drawing, including drip order");
      fallback.clear();
      // Exercise a real renderer while failing only the external Canvas allocation boundary.
      const failed = createSprayRenderer(bc, textures);
      const originalCreate = document.createElement.bind(document);
      let allocations = 0;
      document.createElement = (...args) => {
        const canvas = originalCreate(...args);
        if (args[0] === "canvas") { allocations++; canvas.getContext = () => null; }
        return canvas;
      };
      try {
        const first = failed.render(stamps, 1000, 480, 320, dpr);
        const attempts = allocations;
        const second = failed.render(stamps, 1100, 480, 320, dpr);
        assert(first.cacheBytes === 0 && second.individualStamps === stamps.length && allocations === attempts, "Allocation failure must not retry every frame or reserve memory");
      } finally { document.createElement = originalCreate; failed.clear(); }
      // Limited memory must use a mixture of cached and reference paint, never drop stamps.
      const limited = createSprayRenderer(bc, textures, { maxCacheBytes: 480 * 320 * dpr * dpr * 4 });
      const limitedStats = limited.render(stamps, 1000, 480, 320, dpr);
      assert(limitedStats.cachedGroups === 1 && limitedStats.individualStamps === 160, "One-surface budget must render all remaining stamps individually");
      assert(limitedStats.cacheBytes <= 480 * 320 * dpr * dpr * 4, "Limited budget exceeded");
      limited.clear();
      // Resize invalidates the old device-space surface before reuse.
      renderer.render(stamps, 1000, 480, 320, dpr);
      a.width = b.width = 240 * dpr;
      const resized = renderer.render(stamps, 1000, 240, 320, dpr);
      assert(resized.bakedStamps > 0, "Resize must not reuse old surfaces");
      const reDpr = renderer.render(stamps, 1000, 240, 320, dpr / 2);
      assert(reDpr.bakedStamps > 0, "DPR-only change must invalidate old surfaces");
      renderer.clear();
      // Appending a new topmost stamp must not clear and replay already-correct pixels.
      const incrementalCanvas = make(), incrementalContext = incrementalCanvas.getContext("2d");
      const incremental = createSprayRenderer(incrementalContext, textures, { maxCacheBytes: 0 });
      incremental.render([stamps[0]], 1000, 480, 320, dpr);
      const appended = incremental.render([stamps[0], stamps[1]], 1100, 480, 320, dpr);
      assert(appended.dirtyTiles === 0 && appended.clearedPixels === 0 && appended.incrementalStamps === 1 && appended.redrawnStamps === 1,
        "A new topmost stamp must draw once without clearing or replaying the first stamp");
      const incrementalReference = make(), incrementalReferenceContext = incrementalReference.getContext("2d");
      incrementalReferenceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawReference(incrementalReferenceContext, [stamps[0], stamps[1]], 1100, textures);
      const incrementalPixels = incrementalContext.getImageData(0, 0, incrementalCanvas.width, incrementalCanvas.height).data;
      const referencePixels = incrementalReferenceContext.getImageData(0, 0, incrementalReference.width, incrementalReference.height).data;
      assert(incrementalPixels.every((value, index) => value === referencePixels[index]),
        "Incremental append must exactly match the original draw order");
      incremental.clear();
      results.push({ dpr, preferImageBitmap, checks });
      if (dpr === 2 && preferImageBitmap) { a.width = b.width = 480 * dpr; compare(1100, stamps); document.body.append(a, b); }
      renderer.clear(); textures.dispose();
    }
    return results;
  });
  await writeFile(`${output}/results.json`, JSON.stringify({ browser: browser.version(), results }, null, 2));
  await page.screenshot({ path: `${output}/reference-vs-cache.png`, fullPage: true });
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
