import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(process.env.ABOUT_QA_URL || "http://localhost:3000/about");
  await page.evaluate(() => window.scrollTo(0, 850));
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const frame = [...document.querySelectorAll("[data-about-depth]")]
      .find((element) => element.tagName === "DIV" && element.getBoundingClientRect().width > 0 && getComputedStyle(element).borderStyle === "solid");
    if (!(frame instanceof HTMLElement)) return null;
    const style = getComputedStyle(frame);
    return {
      filter: style.filter,
      scale: new DOMMatrix(style.transform).a,
    };
  });

  assert.ok(state, "mobile bordered introduction frame exists");
  assert.ok(state.scale < 0.95, "mobile introduction frame still scales with scroll");
  assert.equal(state.filter, "none", "bordered introduction frame must not be a blurred compositing layer");
  console.log("PASS: mobile introduction frame scales without filtering its border");
} finally {
  await browser.close();
}
