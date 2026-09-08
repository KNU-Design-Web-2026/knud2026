const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { chromium } = require("playwright");

const TARGET_URL = process.env.SPRAY_TARGET_URL || "https://www.2026-knud-graduation.com/";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = path.resolve(
  process.env.SPRAY_OUTPUT_DIR || path.join(__dirname, "artifacts"),
);
const VIEWPORT = { width: 1512, height: 982 };
const DEVICE_SCALE_FACTOR = 2;
const RUNS = Number(process.env.SPRAY_RUNS || 5);
const TRACE_RUN = Number(process.env.SPRAY_TRACE_RUN || 1);
const HEADLESS = process.env.SPRAY_HEADLESS === "1";
const ONLY_SCENARIO = process.env.SPRAY_SCENARIO || "";
const ONLY_MODE = process.env.SPRAY_MODE || "";
const PROBE_ENABLED = process.env.SPRAY_PROBE !== "0";

const modes = [
  { name: "native", cpuRate: 1 },
  { name: "4x", cpuRate: 4 },
].filter((mode) => !ONLY_MODE || mode.name === ONLY_MODE);

const scenarios = ["idle", "click", "slow-drag", "fast-drag", "decay"].filter(
  (scenario) => !ONLY_SCENARIO || scenario === ONLY_SCENARIO,
);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function quantile(values, ratio) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
  return sorted[index];
}

function round(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function writeTracingStream(client, streamHandle, outputPath) {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  const gzip = zlib.createGzip({ level: 6 });
  const output = fs.createWriteStream(outputPath);
  gzip.pipe(output);

  while (true) {
    const chunk = await client.send("IO.read", { handle: streamHandle });
    const data = chunk.base64Encoded
      ? Buffer.from(chunk.data, "base64")
      : Buffer.from(chunk.data, "utf8");

    if (!gzip.write(data)) {
      await new Promise((resolve) => gzip.once("drain", resolve));
    }

    if (chunk.eof) break;
  }

  await client.send("IO.close", { handle: streamHandle });
  gzip.end();
  await new Promise((resolve, reject) => {
    output.once("finish", resolve);
    output.once("error", reject);
    gzip.once("error", reject);
  });
}

async function startTrace(client) {
  await client.send("Tracing.start", {
    categories: [
      "-*",
      "blink",
      "cc",
      "devtools.timeline",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-v8.cpu_profiler",
      "disabled-by-default-v8.cpu_profiler.hires",
      "renderer.scheduler",
      "toplevel",
      "v8",
      "v8.execute",
      "blink.user_timing",
    ].join(","),
    options: "sampling-frequency=10000",
    transferMode: "ReturnAsStream",
  });
}

async function stopTrace(client, outputPath) {
  const completed = new Promise((resolve) => {
    client.once("Tracing.tracingComplete", resolve);
  });
  await client.send("Tracing.end");
  const { stream } = await completed;
  await writeTracingStream(client, stream, outputPath);
}

async function getSprayPoints(page) {
  const zone = page.locator("#main-spray-zone");
  await zone.waitFor({ state: "visible", timeout: 20_000 });
  const box = await zone.boundingBox();
  if (!box) throw new Error("#main-spray-zone의 좌표를 찾지 못했습니다.");

  const y = box.y + box.height * 0.56;
  return {
    box,
    center: { x: box.x + box.width * 0.5, y },
    left: { x: box.x + box.width * 0.2, y },
    right: { x: box.x + box.width * 0.8, y },
  };
}

async function performRepeatedDrag(client, points, cycles, totalDurationMs) {
  const segments = cycles * 2;
  const segmentDuration = totalDurationMs / segments;
  const stepsPerSegment = Math.max(4, Math.round(segmentDuration / 33.333));
  const totalSteps = segments * stepsPerSegment;
  const inputPromises = [];
  const startedAt = performance.now();

  await client.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: points.left.x,
    y: points.left.y,
    button: "none",
    buttons: 0,
    pointerType: "mouse",
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: points.left.x,
    y: points.left.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
    pointerType: "mouse",
  });

  for (let index = 1; index <= totalSteps; index += 1) {
    const targetTime = startedAt + (totalDurationMs * index) / totalSteps;
    const remaining = targetTime - performance.now();
    if (remaining > 0) await delay(remaining);

    const segmentIndex = Math.min(
      segments - 1,
      Math.floor((index - 1) / stepsPerSegment),
    );
    const stepInSegment = ((index - 1) % stepsPerSegment) + 1;
    const progress = stepInSegment / stepsPerSegment;
    const from = segmentIndex % 2 === 0 ? points.left : points.right;
    const to = segmentIndex % 2 === 0 ? points.right : points.left;

    inputPromises.push(
      client.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
        button: "left",
        buttons: 1,
        pointerType: "mouse",
      }),
    );
  }

  await Promise.all(inputPromises);
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: points.left.x,
    y: points.left.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
    pointerType: "mouse",
  });
}

async function runScenario(page, client, scenario) {
  const points = await getSprayPoints(page);

  if (scenario === "idle") {
    await delay(10_000);
    return;
  }

  if (scenario === "click") {
    await page.mouse.move(points.center.x, points.center.y);
    for (let index = 0; index < 20; index += 1) {
      await page.mouse.click(points.center.x, points.center.y);
      await delay(500);
    }
    await delay(4_000);
    return;
  }

  if (scenario === "slow-drag") {
    await performRepeatedDrag(client, points, 5, 10_000);
    await delay(4_000);
    return;
  }

  if (scenario === "fast-drag") {
    await performRepeatedDrag(client, points, 20, 10_000);
    await delay(4_000);
    return;
  }

  if (scenario === "decay") {
    await performRepeatedDrag(client, points, 10, 5_000);
    await delay(8_000);
    return;
  }

  throw new Error(`알 수 없는 시나리오: ${scenario}`);
}

function summarizeProbe(probe) {
  const durations = probe.renderDurations;
  const intervals = probe.frameIntervals;
  const arcs = probe.arcsPerFrame;
  const measuredActive = probe.activeStampsPerFrame || [];
  const estimatedActive = measuredActive.some((value) => value > 0)
    ? measuredActive
    : arcs.map((value) => value / 82);

  return {
    pointerDowns: probe.pointerDowns,
    pointerMoves: probe.pointerMoves,
    rafCallbacks: probe.rafCallbacks,
    canvasFrames: probe.canvasFrames,
    clearRects: probe.clearRects,
    totalArcCalls: probe.totalArcCalls,
    totalFillCalls: probe.totalFillCalls,
    peakArcsPerFrame: arcs.length ? Math.max(...arcs) : 0,
    peakEstimatedActiveStamps: estimatedActive.length
      ? round(Math.max(...estimatedActive), 2)
      : 0,
    renderDurationP50Ms: round(quantile(durations, 0.5)),
    renderDurationP95Ms: round(quantile(durations, 0.95)),
    renderDurationMaxMs: round(durations.length ? Math.max(...durations) : null),
    frameIntervalP50Ms: round(quantile(intervals, 0.5)),
    frameIntervalP95Ms: round(quantile(intervals, 0.95)),
    frameIntervalMaxMs: round(intervals.length ? Math.max(...intervals) : null),
    frameIntervalsOver16_7Ms: intervals.filter((value) => value > 16.7).length,
    frameIntervalsOver20Ms: intervals.filter((value) => value > 20).length,
    longTaskCount: probe.longTasks.length,
    longTaskTotalMs: round(
      probe.longTasks.reduce((total, duration) => total + duration, 0),
    ),
    longTaskMaxMs: round(
      probe.longTasks.length ? Math.max(...probe.longTasks) : null,
    ),
    raw: {
      renderDurations: durations,
      frameIntervals: intervals,
      arcsPerFrame: arcs,
      fillsPerFrame: probe.fillsPerFrame,
      activeStampsPerFrame: measuredActive,
      longTasks: probe.longTasks,
    },
  };
}

const probeInitScript = `
(() => {
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeClearRect = CanvasRenderingContext2D.prototype.clearRect;
  const nativeArc = CanvasRenderingContext2D.prototype.arc;
  const nativeFill = CanvasRenderingContext2D.prototype.fill;
  const sprayContexts = new WeakSet();
  let currentArcCalls = 0;
  let currentFillCalls = 0;
  let hasOpenFrame = false;
  let lastCanvasFrameAt = null;
  let insideRaf = false;
  let sprayRenderedInsideRaf = false;

  const makeMetrics = () => ({
    pointerDowns: 0,
    pointerMoves: 0,
    rafCallbacks: 0,
    canvasFrames: 0,
    clearRects: 0,
    totalArcCalls: 0,
    totalFillCalls: 0,
    renderDurations: [],
    frameIntervals: [],
    arcsPerFrame: [],
    fillsPerFrame: [],
    activeStampsPerFrame: [],
    longTasks: [],
  });

  let metrics = makeMetrics();

  const isSprayCanvas = (context) => {
    const canvas = context && context.canvas;
    return Boolean(canvas && canvas.closest && canvas.closest('#main-hero'));
  };

  const finalizeOpenFrame = () => {
    if (!hasOpenFrame) return;
    metrics.arcsPerFrame.push(currentArcCalls);
    metrics.fillsPerFrame.push(currentFillCalls);
    currentArcCalls = 0;
    currentFillCalls = 0;
  };

  window.requestAnimationFrame = (callback) => nativeRaf((timestamp) => {
    metrics.rafCallbacks += 1;
    const startedAt = performance.now();
    insideRaf = true;
    sprayRenderedInsideRaf = false;
    try {
      return callback(timestamp);
    } finally {
      const duration = performance.now() - startedAt;
      if (sprayRenderedInsideRaf) metrics.renderDurations.push(duration);
      insideRaf = false;
      sprayRenderedInsideRaf = false;
    }
  });

  CanvasRenderingContext2D.prototype.clearRect = function(...args) {
    if (isSprayCanvas(this)) {
      sprayContexts.add(this);
      finalizeOpenFrame();
      const now = performance.now();
      if (lastCanvasFrameAt !== null) {
        metrics.frameIntervals.push(now - lastCanvasFrameAt);
      }
      lastCanvasFrameAt = now;
      hasOpenFrame = true;
      metrics.canvasFrames += 1;
      metrics.clearRects += 1;
      metrics.activeStampsPerFrame.push(
        this.canvas.__knudSprayActiveStamps || 0,
      );
      if (insideRaf) sprayRenderedInsideRaf = true;
    }
    return nativeClearRect.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.arc = function(...args) {
    if (sprayContexts.has(this)) {
      currentArcCalls += 1;
      metrics.totalArcCalls += 1;
    }
    return nativeArc.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.fill = function(...args) {
    if (sprayContexts.has(this)) {
      currentFillCalls += 1;
      metrics.totalFillCalls += 1;
    }
    return nativeFill.apply(this, args);
  };

  document.addEventListener('pointerdown', (event) => {
    const zone = document.getElementById('main-spray-zone');
    if (zone && (zone === event.target || zone.contains(event.target))) {
      metrics.pointerDowns += 1;
    }
  }, true);

  document.addEventListener('pointermove', (event) => {
    const zone = document.getElementById('main-spray-zone');
    if (zone && event.buttons === 1) metrics.pointerMoves += 1;
  }, true);

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.longTasks.push(entry.duration);
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch {}

  window.__sprayProbe = {
    reset() {
      metrics = makeMetrics();
      currentArcCalls = 0;
      currentFillCalls = 0;
      hasOpenFrame = false;
      lastCanvasFrameAt = null;
    },
    snapshot() {
      const snapshot = JSON.parse(JSON.stringify(metrics));
      if (hasOpenFrame) {
        snapshot.arcsPerFrame.push(currentArcCalls);
        snapshot.fillsPerFrame.push(currentFillCalls);
      }
      return snapshot;
    },
  };
})();
`;

async function main() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: HEADLESS,
    args: ["--no-first-run", "--disable-default-apps"],
  });
  const allResults = [];

  try {
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        screen: VIEWPORT,
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        reducedMotion: "no-preference",
        colorScheme: "light",
      });
      if (PROBE_ENABLED) {
        await context.addInitScript({ content: probeInitScript });
      }
      const page = await context.newPage();
      const client = await context.newCDPSession(page);
      await client.send("Performance.enable", { timeDomain: "timeTicks" });
      await client.send("Emulation.setCPUThrottlingRate", { rate: mode.cpuRate });

      console.log(`[mode:${mode.name}] warm cache 준비`);
      await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(5_000);
      const pageFacts = await page.evaluate(() => ({
        title: document.title,
        url: location.href,
        dpr: devicePixelRatio,
        viewport: { width: innerWidth, height: innerHeight },
        canvasCount: document.querySelectorAll("canvas").length,
        sprayZoneExists: Boolean(document.getElementById("main-spray-zone")),
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        finePointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
      }));
      console.log(`[mode:${mode.name}] page facts ${JSON.stringify(pageFacts)}`);

      for (const scenario of scenarios) {
        for (let run = 1; run <= RUNS; run += 1) {
          console.log(`[mode:${mode.name}] [${scenario}] run ${run}/${RUNS} 시작`);
          await page.reload({ waitUntil: "networkidle", timeout: 60_000 });
          await page.waitForTimeout(5_000);
          if (PROBE_ENABLED) {
            await page.evaluate(() => window.__sprayProbe.reset());
          }
          await client.send("HeapProfiler.collectGarbage");
          const heapBefore = await client.send("Runtime.getHeapUsage");
          const performanceBefore = await client.send("Performance.getMetrics");
          const shouldTrace = run === TRACE_RUN;
          const tracePath = path.join(
            OUTPUT_DIR,
            `spray-${scenario}-${mode.name}-run-${String(run).padStart(2, "0")}.trace.json.gz`,
          );

          if (shouldTrace) await startTrace(client);
          const startedAt = performance.now();
          await runScenario(page, client, scenario);
          const elapsedMs = performance.now() - startedAt;
          if (shouldTrace) await stopTrace(client, tracePath);

          await client.send("HeapProfiler.collectGarbage");
          const heapAfter = await client.send("Runtime.getHeapUsage");
          const performanceAfter = await client.send("Performance.getMetrics");
          const probe = PROBE_ENABLED
            ? await page.evaluate(() => window.__sprayProbe.snapshot())
            : null;
          const summary = probe ? summarizeProbe(probe) : null;
          const result = {
            measuredAt: new Date().toISOString(),
            targetUrl: TARGET_URL,
            mode: mode.name,
            cpuThrottlingRate: mode.cpuRate,
            scenario,
            run,
            warmup: run === 1,
            probeEnabled: PROBE_ENABLED,
            traced: shouldTrace,
            tracePath: shouldTrace ? path.relative(process.cwd(), tracePath) : null,
            elapsedMs: round(elapsedMs),
            page: pageFacts,
            heap: {
              beforeUsedSize: heapBefore.usedSize,
              afterGcUsedSize: heapAfter.usedSize,
              deltaAfterGc: heapAfter.usedSize - heapBefore.usedSize,
            },
            performanceMetrics: {
              before: performanceBefore.metrics,
              after: performanceAfter.metrics,
            },
            metrics: summary,
          };
          allResults.push(result);

          const resultPath = path.join(
            OUTPUT_DIR,
            `spray-${scenario}-${mode.name}-run-${String(run).padStart(2, "0")}.metrics.json`,
          );
          await fs.promises.writeFile(resultPath, JSON.stringify(result, null, 2));
          console.log(
            `[mode:${mode.name}] [${scenario}] run ${run} 완료 ` +
              JSON.stringify({
                pointerMoves: summary?.pointerMoves ?? null,
                canvasFrames: summary?.canvasFrames ?? null,
                peakEstimatedActiveStamps: summary?.peakEstimatedActiveStamps ?? null,
                renderP95: summary?.renderDurationP95Ms ?? null,
                intervalP95: summary?.frameIntervalP95Ms ?? null,
                longTasks: summary?.longTaskCount ?? null,
              }),
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  await fs.promises.writeFile(
    path.join(OUTPUT_DIR, "all-results.json"),
    JSON.stringify(allResults, null, 2),
  );
  console.log(`전체 측정 완료: ${allResults.length} runs`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
