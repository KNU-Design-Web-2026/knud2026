import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { summarizeMeasurements } from "./space-evidence-summary.mjs";
import { packageEvidence } from "./package-space-evidence.mjs";

const repo = process.cwd();
const options = Object.fromEntries(process.argv.slice(2).map(arg => {
  const separator = arg.indexOf("=");
  assert.ok(arg.startsWith("--") && separator > 2, "Use --name=value");
  return [arg.slice(2, separator), arg.slice(separator + 1)];
}));
assert.ok(options["baseline-root"], "Supply the independent baseline directory with --baseline-root=...");
const baselineRoot = resolve(options["baseline-root"]);
const runName = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(repo, "artifacts", "space-preview", "recordings", runName);
const urls = { baseline: options.baseline ?? "http://127.0.0.1:3101", candidate: options.candidate ?? "http://127.0.0.1:3102" };
for (const url of Object.values(urls)) {
  assert.equal(new URL(url).hostname, "127.0.0.1", "Evidence capture is local-only; do not target production");
}
const sources = ["src/components/space/space-map.tsx", "src/components/space/space-page.module.css", "src/data/work-items.ts", "src/components/space/space-booths.ts", "src/data/submitted-works.ts", "public/assets/works/yoon-iji/manifest.json"];
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const head = git("rev-parse", "HEAD");
// HEAD changes when the candidate is committed. Keep the historical control
// revision explicit so the same before/after recording remains reproducible.
const baselineRevision = git("rev-parse", options["baseline-ref"] ?? "5328fc2");
const sourceIdentities = {};
await mkdir(output, { recursive: true });
for (const [label, root] of [["baseline", baselineRoot], ["candidate", repo]]) {
  sourceIdentities[label] = { buildId: (await readFile(resolve(root, ".next/BUILD_ID"), "utf8")).trim(), files: {} };
  for (const path of [...sources, ...(label === "candidate" ? ["src/components/space/preview-load-state.ts"] : [])]) {
    const bytes = await readFile(resolve(root, path));
    if (label === "baseline") assert.equal(digest(bytes), digest(execFileSync("git", ["show", `${baselineRevision}:${path}`], { cwd: repo })), `Baseline differs from control revision: ${path}`);
    sourceIdentities[label].files[path] = digest(bytes);
    // Evidence sources are inert text, outside the app's TS compilation graph.
    const destination = resolve(output, "source", label, `${path}.txt`);
    await mkdir(resolve(destination, ".."), { recursive: true });
    await cp(resolve(root, path), destination);
  }
}
const metrics = {};
for (const label of ["baseline", "candidate"]) {
  const source = resolve(repo, "artifacts/space-preview", `${label}.json`);
  const raw = await readFile(source);
  const data = JSON.parse(raw);
  metrics[label] = { sha256: digest(raw), capturedAt: data.capturedAt, sha: data.sha, summary: summarizeMeasurements(data) };
  await mkdir(resolve(output, "metrics"), { recursive: true });
  await cp(source, resolve(output, "metrics", `${label}.json`));
}
const before = JSON.parse(await readFile(resolve(output, "metrics/baseline.json")));
const after = JSON.parse(await readFile(resolve(output, "metrics/candidate.json")));
for (const key of ["browser", "platform", "arch", "runs", "viewport", "conditions"]) assert.deepEqual(before[key], after[key], `Metrics differ on ${key}`);
await writeFile(resolve(output, "metrics/summary.json"), JSON.stringify({ scope: "Previously measured, WITHOUT video or tracing; not the recording sessions", metrics }, null, 2));

const browser = await chromium.launch();
const cases = [];
const target = url => new URL(url).searchParams.get("url")?.includes("/yoon-iji/space.webp");
async function record(label, mode) {
  const name = `${label}-${mode}`;
  const dir = resolve(output, name);
  await mkdir(dir);
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
    serviceWorkers: "block", recordVideo: { dir, size: { width: 1920, height: 1080 } } });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const video = page.video();
  const started = Date.now();
  const events = [];
  const event = (type, details = {}) => events.push({ msSinceContextStart: Date.now() - started, type, ...details });
  page.on("request", request => { if (target(request.url())) event("image-request", { url: request.url() }); });
  page.on("requestfailed", request => { if (target(request.url())) event("image-request-failed", { failure: request.failure() }); });
  page.on("response", response => { if (target(response.url())) event("image-response", { status: response.status() }); });
  let attempt = 0;
  if (mode !== "slow-cold") await page.route("**/_next/image?**", async route => {
    if (target(route.request().url())) {
      attempt++;
      if (mode === "error-retry" && attempt === 1) { await route.abort("failed"); return; }
      await new Promise(done => setTimeout(done, mode === "held-8s" ? 8_000 : 3_000));
    }
    await route.continue();
  });
  const result = { name, label, mode, baseURL: urls[label], viewport: [1920, 1080], recorded: true, usedForBenchmark: false,
    routing: mode !== "slow-cold", injectedDelayMs: mode === "held-8s" ? 8_000 : mode === "error-retry" ? 3_000 : null,
    network: mode === "slow-cold" ? { latencyMs: 400, downBytesPerSecond: 50_000, upBytesPerSecond: 25_000, phase: "selection only" } : "unthrottled local connection with synthetic fault",
    events };
  let failure;
  try {
    await page.goto(`${urls[label]}/space`);
    await page.evaluate(() => document.fonts.ready);
    const owner = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
    await owner.scrollIntoViewIfNeeded();
    // Put the map's lower half and popup in the recorded viewport; unlike the
    // benchmark this is a presentation capture, not a latency sample.
    await page.evaluate(() => {
      const map = document.querySelector("#space-project-preview").parentElement;
      window.scrollTo(0, map.getBoundingClientRect().top + window.scrollY + 100);
    });
    await page.waitForTimeout(500);
    if (mode === "slow-cold") {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 50_000, uploadThroughput: 25_000, connectionType: "cellular3g" });
    }
    event("select-work", { artist: "윤이지", work: "3et", method: "focus" });
    await owner.focus();
    const preview = page.locator("#space-project-preview");
    async function snapshot(stage) {
      const observation = await preview.evaluate(box => {
        let opacity = 1;
        for (let node = box.querySelector("h3"); node; node = node.parentElement) {
          const css = getComputedStyle(node);
          if (css.display === "none" || css.visibility === "hidden") opacity = 0;
          opacity *= Number(css.opacity);
        }
        return { open: box.dataset.open, imageState: box.dataset.imageState, title: box.querySelector("h3").textContent,
          informationOpacity: opacity, hasInlinePreview: !!box.querySelector('[style*="data:image/"]'),
          status: box.querySelector('[role="status"]')?.textContent, imageSrc: box.querySelector("img").currentSrc };
      });
      event(`snapshot-${stage}`, observation);
      await page.screenshot({ path: resolve(dir, `${stage}.png`) });
      await preview.screenshot({ path: resolve(dir, `${stage}-detail.png`) });
      return observation;
    }
    if (mode === "slow-cold") {
      await page.waitForTimeout(350);
      await snapshot("early");
    } else if (mode === "held-8s") {
      await page.waitForTimeout(2_500);
      const pending = await snapshot("pending");
      assert.equal(pending.imageState, "loading");
      assert.equal(pending.informationOpacity >= .99, label === "candidate");
    } else {
      await page.locator('#space-project-preview[data-image-state="error"]').waitFor();
      const error = await snapshot("error");
      assert.ok(error.informationOpacity >= .99);
      await page.waitForTimeout(1_000);
      event("retry-keyboard");
      await page.keyboard.press("Tab");
      assert.equal(await preview.getByRole("button").evaluate(el => el === document.activeElement), true);
      await page.keyboard.press("Enter");
      assert.equal(await owner.evaluate(el => el === document.activeElement), true);
      await page.waitForTimeout(500);
      await snapshot("retry-loading");
    }
    await page.locator('#space-project-preview[data-image-state="ready"]').waitFor({ timeout: 20_000 });
    event("high-quality-ready");
    await snapshot("ready");
    await page.waitForTimeout(1_500);
    if (mode === "error-retry") {
      await page.keyboard.press("Enter");
      await page.waitForURL("**/work/12");
      event("detail-navigation", { pathname: new URL(page.url()).pathname });
      await page.screenshot({ path: resolve(dir, "detail-navigation.png") });
      await page.waitForTimeout(700);
    }
    result.passed = true;
  } catch (error) {
    failure = error;
    result.passed = false;
    result.error = String(error);
  } finally {
    try { await context.tracing.stop({ path: resolve(dir, "trace.zip") }); }
    finally { await context.close(); }
    await rename(await video.path(), resolve(dir, "recording.webm"));
    await writeFile(resolve(dir, "observations.json"), JSON.stringify(result, null, 2));
    cases.push(result);
    console.log(`${name}: ${result.passed ? "PASS" : "FAIL"}`);
  }
  if (failure) throw failure;
}
try {
  for (const mode of ["slow-cold", "held-8s"]) for (const label of ["baseline", "candidate"]) await record(label, mode);
  await record("candidate", "error-retry");
} finally {
  await browser.close();
  for (const [label, identity] of Object.entries(sourceIdentities)) for (const [path, hash] of Object.entries(identity.files)) {
    assert.equal(digest(await readFile(resolve(label === "baseline" ? baselineRoot : repo, path))), hash, `Source changed during capture: ${path}`);
  }
  await writeFile(resolve(output, "manifest.json"), JSON.stringify({ capturedAt: new Date().toISOString(), timezone: "Asia/Seoul", browser: browser.version(),
    node: process.version, platform: process.platform, arch: process.arch, repoHead: head, baselineRevision, branch: git("branch", "--show-current"),
    gitStatus: git("status", "--short"), sourceIdentities,
    limitation: "Historical measurements had no source-tree hash. Current source/build identities describe this recording only, not retroactive proof of the historical measurement build. Video/tracing is excluded from benchmark statistics.",
    cases }, null, 2));
}
await packageEvidence(output);
console.log(`Evidence bundle: ${output}`);
