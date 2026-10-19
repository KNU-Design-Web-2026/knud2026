import assert from "node:assert/strict";
import test from "node:test";
import { getWorkImagePlaceholder } from "../../lib/work-image-placeholder.ts";

test("작품의 작은 이미지는 추가 블러 없이 직접 placeholder로 제공한다", () => {
  const preview = "data:image/webp;base64,UklGRg==";
  assert.equal(getWorkImagePlaceholder(preview), preview);
  for (const missing of [undefined, "", "/missing.webp", "https://example.com/image.webp"]) {
    assert.equal(getWorkImagePlaceholder(missing), "empty");
  }
});
