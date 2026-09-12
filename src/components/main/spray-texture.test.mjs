import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./spray-texture.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace('"./spray-paint"', JSON.stringify(new URL("./spray-paint.ts", import.meta.url).href));
const { createSprayTextureCache } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("texture promotion, fallback and lifetime", async (t) => {
  const context = { scale() {}, translate() {}, beginPath() {}, arc() {}, fill() {} };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  } });
  const setFactory = (value) => Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value });
  t.after(() => {
    for (const [key, descriptor] of [["document", originalDocument], ["createImageBitmap", originalBitmap]]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const stamp = { particles: [{ x: 0, y: 0, radius: 1, alpha: 0.5 }], color: "#fff" };
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  let resolveBitmap, calls = 0, closes = 0;
  setFactory(() => { calls++; return new Promise((resolve) => { resolveBitmap = resolve; }); });
  const cache = createSprayTextureCache();
  const canvas = cache.get(stamp);
  assert.equal(canvas.width, 336);
  assert.equal(cache.get(stamp), canvas);
  assert.equal(calls, 1);
  const bitmap = { close: () => { closes++; } };
  resolveBitmap(bitmap);
  await flush();
  assert.equal(cache.get(stamp), bitmap);
  assert.equal(canvas.width, 0);
  cache.dispose(); cache.dispose();
  assert.equal(closes, 1);
  assert.throws(() => cache.get(stamp), /disposed/);

  // Disposed effects must not leak asynchronously resolved bitmaps.
  const pending = createSprayTextureCache();
  pending.get(stamp); pending.dispose(); resolveBitmap(bitmap);
  await flush();
  assert.equal(closes, 2);

  for (const factory of [undefined, () => Promise.reject(new Error("failed")), () => { throw new Error("failed"); }]) {
    calls = 0;
    setFactory(factory && (() => { calls++; return factory(); }));
    const fallback = createSprayTextureCache();
    const first = fallback.get(stamp);
    await flush();
    assert.equal(fallback.get(stamp), first);
    assert.equal(first.width, 336);
    assert.equal(calls, factory ? 1 : 0);
    assert.notEqual(fallback.get({ ...stamp, color: "#000" }), first);
    assert.notEqual(fallback.get({ ...stamp, particles: [...stamp.particles] }), first);
    fallback.dispose();
    await flush();
  }
  setFactory(() => { throw new Error("Canvas comparison must not convert"); });
  const baseline = createSprayTextureCache({ preferImageBitmap: false });
  assert.equal(baseline.get(stamp).width, 336);
  baseline.dispose();
});
