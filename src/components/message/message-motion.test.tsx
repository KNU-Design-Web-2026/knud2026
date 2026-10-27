import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MessagePage } from "./message-page";

test("the observed message shell never carries the initial translation animation", () => {
  const html = renderToStaticMarkup(<MessagePage initialMessages={[{
    id: "1", to: "전체(모두)", from: "관람객", body: "졸업 축하해요",
    createdAt: "2026-10-28T00:00:00Z",
  }]} />);
  const card = html.match(/<article\b([^>]*)>([\s\S]*?)<\/article>/);
  assert.ok(card, "the message must render");
  assert.match(card[1], /data-message-reveal/);
  assert.doesNotMatch(card[1], /message-card--initial-reveal/,
    "moving the observed shell can repeatedly cross the viewport boundary");
  assert.match(card[2], /class="message-card__surface message-card--initial-reveal"/,
    "the paper, including its background, must animate inside a fixed shell");
  assert.match(card[2], /From\. 관람객/);
});
