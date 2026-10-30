import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, "").split("=")));
const baseURL = args.url ?? "http://127.0.0.1:3102";
const output = args.output ?? "artifacts/space-preview/candidate.json";
const runs = Number(args.runs ?? 10);
const browser = await chromium.launch();
const results = [];
try {
  for (const network of ["normal", "slow"]) {
    for (const cache of ["cold", "warm"]) {
      for (let run = 1; run <= runs; run++) {
        const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, serviceWorkers: "block" });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
        await page.goto(`${baseURL}/space`);
        await page.evaluate(() => document.fonts.ready);
        const initialTransfer = await page.evaluate(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          const scripts = performance.getEntriesByType("resource").filter(r => r.initiatorType === "script" && new URL(r.name).origin === location.origin);
          return { htmlEncodedBytes: navigation.encodedBodySize, scriptEncodedBytes: scripts.reduce((sum, r) => sum + r.encodedBodySize, 0) };
        });
        const owner = page.getByRole("link", { name: /^윤이지 .*작품 정보 보기$/ });
        await owner.scrollIntoViewIfNeeded();
        if (cache === "warm") {
          await owner.focus();
          await page.locator('#space-project-preview[data-image-state="ready"]').waitFor();
          await page.getByRole("link", { name: /^김서은 .*작품 정보 보기$/ }).focus();
        }
        // Navigation is intentionally outside throttling: this measures the
        // already-interactive map selection, not whole-page field performance.
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false, latency: network === "slow" ? 400 : 0,
          downloadThroughput: network === "slow" ? 50_000 : -1,
          uploadThroughput: network === "slow" ? 25_000 : -1,
          connectionType: network === "slow" ? "cellular3g" : "wifi",
        });
        const observation = await page.evaluate(async () => {
          const owner = [...document.querySelectorAll('a[aria-label]')].find(n => n.getAttribute("aria-label").startsWith("윤이지 "));
          const start = performance.now();
          owner.focus();
          let informationMs = null;
          let previewMs = null;
          let readyMs = null;
          let finalSrc = null;
          return new Promise(resolve => {
            function frame() {
              const box = document.querySelector("#space-project-preview");
              const heading = box.querySelector("h3");
              let opacity = 1;
              for (let node = heading; node; node = node.parentElement) {
                const css = getComputedStyle(node);
                if (css.display === "none" || css.visibility === "hidden") opacity = 0;
                opacity *= Number(css.opacity);
              }
              const elapsed = performance.now() - start;
              const selected = heading.textContent === "3et" && box.dataset.open === "true";
              if (selected && opacity >= .99 && informationMs === null) informationMs = elapsed;
              if (selected && opacity >= .99 && box.querySelector('[style*="data:image/"]') && previewMs === null) previewMs = elapsed;
              if (selected && box.dataset.imageState === "ready" && opacity >= .99) {
                readyMs = elapsed;
                finalSrc = box.querySelector("img").currentSrc;
              }
              if (readyMs !== null || elapsed > 20_000) {
                const resources = performance.getEntriesByType("resource").filter(r => new URL(r.name).searchParams.get("url")?.includes("/yoon-iji/space.webp"));
                resolve({ informationMs, previewMs, readyMs, finalSrc, timedOut: readyMs === null,
                  selectionResourceEntries: resources.filter(r => r.startTime >= start).length,
                  resources: resources.map(r => ({ name: r.name, beforeSelection: r.startTime < start, duration: r.duration, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize })) });
              } else requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          });
        });
        results.push({ network, cache, run, initialTransfer, ...observation });
        console.log(`${network}/${cache}/${run} info=${observation.informationMs?.toFixed(0)} ready=${observation.readyMs?.toFixed(0)}`);
        await context.close();
      }
    }
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ capturedAt: new Date().toISOString(), baseURL, label: args.label, sha: args.sha,
    browser: browser.version(), platform: process.platform, arch: process.arch, runs, viewport: [1920, 1080],
    conditions: { slow: { latencyMs: 400, downBytesPerSecond: 50_000, upBytesPerSecond: 25_000 }, throttlePhase: "selection only", serviceWorkers: "block", routing: false, serverImageCache: "warm" }, results }, null, 2));
} finally { await browser.close(); }
