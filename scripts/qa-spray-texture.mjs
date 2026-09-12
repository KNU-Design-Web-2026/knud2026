// Isolated pixel parity check, not a performance benchmark.
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = resolve(process.env.SPRAY_QA_OUTPUT || "artifacts/spray-texture");
await mkdir(output, { recursive: true });
const compile = async (name) => ts.transpileModule(await readFile(new URL(`../src/components/main/${name}.ts`, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const paint = await compile("spray-paint");
const texture = (await compile("spray-texture")).replace('"./spray-paint"', '"./spray-paint.js"');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route("http://spray.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: path.endsWith(".js") ? "text/javascript" : "text/html", body:
      path === "/spray-paint.js" ? paint : path === "/spray-texture.js" ? texture : "<title>Spray pixel parity</title>" });
  });
  await page.goto("http://spray.test/");
  const result = await page.evaluate(async () => {
    const { createPaintStamp, getPaintOpacity } = await import("/spray-paint.js");
    const { createSprayTextureCache } = await import("/spray-texture.js");
    let seed = 42;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const colors = ["#ffda00", "#ff1a1a", "#fffaf0", "#ff9518", "#37c8ef"];
    const stamps = Array.from({ length: 500 }, (_, i) => createPaintStamp({ x: 90 + random() * 420, y: 90 + random() * 220 }, 0, i % 2 ? random() * 6.28 : null, colors[i % 5], random));
    const baseline = createSprayTextureCache({ preferImageBitmap: false });
    const candidate = createSprayTextureCache();
    for (const stamp of stamps) { baseline.get(stamp); candidate.get(stamp); }
    const deadline = performance.now() + 10000;
    while (!stamps.every((stamp) => candidate.get(stamp) instanceof ImageBitmap)) {
      if (performance.now() > deadline) throw new Error("Bitmap promotion timed out");
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const render = (cache, now) => {
      const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 800;
      const ctx = canvas.getContext("2d"); ctx.scale(2, 2);
      for (const stamp of stamps) {
        ctx.save(); ctx.translate(stamp.x, stamp.y); ctx.rotate(stamp.direction);
        ctx.scale(stamp.bodyWidth / 27, stamp.bodyHeight / 21);
        ctx.globalAlpha = getPaintOpacity(0, now) * 0.73;
        ctx.drawImage(cache.get(stamp), -84, -84, 168, 168); ctx.restore();
      }
      return { canvas, pixels: ctx.getImageData(0, 0, 1200, 800).data };
    };
    const checks = [];
    for (const now of [0, 5400, 6000, 6599, 6600]) {
      const a = render(baseline, now), b = render(candidate, now);
      let maxChannelDifference = 0, changedChannels = 0, visiblePixels = 0;
      for (let i = 0; i < a.pixels.length; i++) {
        const delta = Math.abs(a.pixels[i] - b.pixels[i]);
        if (delta) changedChannels++;
        maxChannelDifference = Math.max(maxChannelDifference, delta);
        if (i % 4 === 3 && a.pixels[i] > 0) visiblePixels++;
      }
      checks.push({ now, changedChannels, maxChannelDifference, visiblePixels });
      if (now === 0) { document.body.append(a.canvas, b.canvas); }
    }
    baseline.dispose(); candidate.dispose();
    return { stamps: stamps.length, dpr: 2, checks };
  });
  await page.screenshot({ path: `${output}/canvas-vs-bitmap.png`, fullPage: true });
  await writeFile(`${output}/pixel-parity.json`, JSON.stringify({ ...result, browser: browser.version() }, null, 2));
  console.log(result);
  assert.ok(result.checks.every((check) => check.maxChannelDifference === 0), "Pixel output differs; review before accepting");
  assert.ok(result.checks[0].visiblePixels > 10000, "Parity must compare actual paint, not blank canvases");
  assert.equal(result.checks.at(-1).visiblePixels, 0, "Paint must expire at 6.6 seconds");
} finally { await browser.close(); }
