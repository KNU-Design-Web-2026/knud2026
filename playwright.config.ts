import { defineConfig, devices } from "@playwright/test";

// Evidence runs are deliberately separate from timing runs. Recording/tracing
// adds overhead; never use these executions as the benchmark's sample set.
const captureEvidence = process.env.SPACE_CAPTURE === "1";
const captureRun = process.env.SPACE_CAPTURE_RUN ?? new Date().toISOString().replace(/[:.]/g, "-");
// Workers reload this config; inherit one run identity instead of splitting
// successful recordings into a different timestamp directory per worker.
if (captureEvidence) process.env.SPACE_CAPTURE_RUN = captureRun;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 20_000,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: captureEvidence ? `artifacts/playwright-recordings/${captureRun}` : "artifacts/playwright",
  use: {
    baseURL: process.env.SPACE_TEST_URL ?? "http://127.0.0.1:3102",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    trace: captureEvidence ? "on" : "retain-on-failure",
    screenshot: captureEvidence ? "on" : "only-on-failure",
    video: captureEvidence ? { mode: "on", size: { width: 1920, height: 1080 } } : "off",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
