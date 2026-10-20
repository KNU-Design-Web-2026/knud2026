import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

// Optional external QA runtime; no browser or test dependency enters the app bundle.
const runtimePath = process.env.PLAYWRIGHT_MODULE_PATH;
const { webkit } = await import(runtimePath ? pathToFileURL(runtimePath).href : "playwright");
const baseUrl = process.env.MESSAGE_LAYOUT_BASE_URL ?? "http://localhost:3000";
const widths = [320, 360, 375, 390, 393, 399, 400, 412, 414, 428, 430, 440, 480, 481,
  600, 601, 700, 701, 768, 820, 821, 822, 1019, 1020, 1150, 1350, 1439, 1440,
  1512, 1600, 1799, 1800, 1920];
const browser = await webkit.launch();
const failures = [];
let checked = 0;

try {
  const page = await browser.newPage({
    viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true,
    reducedMotion: "reduce",
  });
  await page.goto(new URL("/message", baseUrl).href);
  await page.locator(".message-card__from").first().waitFor();
  await page.locator(".message-card--initial-reveal").first().waitFor({ state: "detached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const list = document.querySelector(".message-list");
    const sample = list.querySelector(".message-card");
    const cases = ["짧은 메시지", "가".repeat(100), "W".repeat(100),
      ("가".repeat(4) + "\n").repeat(4) + "가".repeat(4),
      ("졸업전시 축하해! 앞으로도 멋진 작품 많이 보여줘. ").repeat(5).slice(0, 100),
      "가".repeat(40) + "\n" + "나".repeat(40)];
    cases.forEach((body, index) => {
      const card = sample.cloneNode(true);
      card.className = "message-card";
      card.dataset.layoutProbe = String(index);
      card.dataset.messageVisible = "true";
      card.querySelector(".message-card__body").textContent = body;
      card.querySelector(".message-card__from").textContent = "From. " + "가".repeat(20);
      card.querySelector(".message-card__recipient-name").textContent = "전체(모두)";
      list.append(card);
    });
  });

  for (const width of widths) {
    await page.setViewportSize({ width, height: 956 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const results = await page.locator(".message-card").evaluateAll(cards => cards.map(card => {
      const paper = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      const content = card.querySelector(".message-card__content");
      const from = card.querySelector(".message-card__from");
      const body = card.querySelector(".message-card__body");
      const copy = card.querySelector(".message-card__copy");
      const sender = from.getBoundingClientRect();
      const lowerInset = paper.bottom - sender.bottom;
      return {
        probe: card.dataset.layoutProbe ?? "real",
        clippedSender: lowerInset < Number.parseFloat(style.paddingBottom) - 1,
        clippedContent: content.getBoundingClientRect().bottom > paper.bottom - Number.parseFloat(style.paddingBottom) + 1,
        clippedBody: body.scrollHeight > body.clientHeight + 1,
        clippedCopy: copy.scrollHeight > copy.clientHeight + 1,
        senderOverflow: from.scrollWidth > from.clientWidth + 1 || from.scrollHeight > from.clientHeight + 1,
        overlap: sender.top - body.getBoundingClientRect().bottom < 7,
        lowerInset: Math.round(lowerInset * 100) / 100,
        paperHeight: Math.round(paper.height * 100) / 100,
      };
    }));
    checked += results.length;
    failures.push(...results.filter(result => result.clippedSender || result.clippedContent ||
      result.clippedBody || result.clippedCopy || result.senderOverflow || result.overlap)
      .map(result => ({ width, ...result })));
    if (width <= 821) {
      assert.equal(await page.locator(".message-list").evaluate(list =>
        getComputedStyle(list).gridTemplateColumns.split(" ").length), 2, `${width}px needs two columns`);
    }
  }
  console.log(JSON.stringify({ engine: "webkit", widths: widths.length, checked,
    failureCount: failures.length, failures: failures.slice(0, 12) }, null, 2));
  assert.equal(failures.length, 0, "MESSAGE content and From. must fit inside the padded paper");
} finally {
  await browser.close();
}
