const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const TARGET_URL = process.env.SPRAY_TARGET_URL || "http://127.0.0.1:3000/";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = path.resolve(
  process.env.SPRAY_VISUAL_OUTPUT_DIR ||
    path.join(
      __dirname,
      "..",
      "optimized",
      "evidence",
      "visual-diff",
    ),
);
const SEED = Number(process.env.SPRAY_SEED || 20_260_908);
const VIEWPORT = { width: 1512, height: 982 };
const DEVICE_SCALE_FACTOR = 2;

function withEvidenceQuery(renderer) {
  const url = new URL(TARGET_URL);
  url.searchParams.set("spraySeed", String(SEED));
  url.searchParams.set("sprayRenderer", renderer);
  return url.toString();
}

async function dispatchFixedDrag(page, client) {
  const zone = page.locator("#main-spray-zone");
  await zone.waitFor({ state: "visible", timeout: 20_000 });
  const box = await zone.boundingBox();

  if (!box) {
    throw new Error("#main-spray-zone의 좌표를 찾지 못했습니다.");
  }

  const y = box.y + box.height * 0.56;
  const leftX = box.x + box.width * 0.24;
  const rightX = box.x + box.width * 0.76;

  await client.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: leftX,
    y,
    button: "none",
    buttons: 0,
    pointerType: "mouse",
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: leftX,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
    pointerType: "mouse",
  });

  for (let index = 1; index <= 72; index += 1) {
    const phase = index / 72;
    const progress = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: leftX + (rightX - leftX) * progress,
      y,
      button: "left",
      buttons: 1,
      pointerType: "mouse",
    });
  }

  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: leftX,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
    pointerType: "mouse",
  });
  await page.waitForTimeout(100);
}

async function captureRenderer(browser, renderer) {
  const rawVideoDir = path.join(OUTPUT_DIR, "raw-video", renderer);
  await fs.promises.mkdir(rawVideoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    recordVideo: {
      dir: rawVideoDir,
      size: VIEWPORT,
    },
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const video = page.video();

  await page.goto(withEvidenceQuery(renderer), { waitUntil: "networkidle" });
  await page.waitForTimeout(1_000);
  await dispatchFixedDrag(page, client);

  const canvas = page.locator("#main-hero canvas");
  await canvas.screenshot({
    path: path.join(OUTPUT_DIR, `${renderer}-canvas.png`),
  });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${renderer}-hero.png`),
    fullPage: false,
  });

  await page.waitForTimeout(2_600);
  await context.close();

  if (video) {
    const rawVideoPath = await video.path();
    const outputVideoPath = path.join(OUTPUT_DIR, `${renderer}-capture.mp4`);
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        rawVideoPath,
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputVideoPath,
      ],
      { stdio: "ignore" },
    );
  }
}

function runMetric(filter, legacyPath, optimizedPath) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-i",
      legacyPath,
      "-i",
      optimizedPath,
      "-lavfi",
      filter,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );

  if (result.error) {
    throw result.error;
  }

  return result.stderr;
}

function extractMetric(log, pattern) {
  const match = log.match(pattern);
  return match ? Number(match[1]) : null;
}

async function main() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  try {
    await captureRenderer(browser, "legacy");
    await captureRenderer(browser, "optimized");
  } finally {
    await browser.close();
  }

  const legacyCanvas = path.join(OUTPUT_DIR, "legacy-canvas.png");
  const optimizedCanvas = path.join(OUTPUT_DIR, "optimized-canvas.png");
  const diffPath = path.join(OUTPUT_DIR, "canvas-diff.png");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      legacyCanvas,
      "-i",
      optimizedCanvas,
      "-filter_complex",
      "[0:v][1:v]blend=all_mode=difference",
      "-frames:v",
      "1",
      diffPath,
    ],
    { stdio: "ignore" },
  );

  const ssimLog = runMetric("ssim", legacyCanvas, optimizedCanvas);
  const psnrLog = runMetric("psnr", legacyCanvas, optimizedCanvas);
  const result = {
    capturedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    seed: SEED,
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    ssim: extractMetric(ssimLog, /All:([0-9.]+)/),
    psnrAverageDb: extractMetric(psnrLog, /average:([0-9.]+)/),
    files: {
      legacyCanvas: path.basename(legacyCanvas),
      optimizedCanvas: path.basename(optimizedCanvas),
      diff: path.basename(diffPath),
      legacyVideo: "legacy-capture.mp4",
      optimizedVideo: "optimized-capture.mp4",
    },
  };

  await fs.promises.writeFile(
    path.join(OUTPUT_DIR, "comparison.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
