import assert from "node:assert/strict";
import test from "node:test";
import { spaceBooths, mobileSpaceBooths } from "./space-booths.ts";
import { getSpaceWork } from "./space-works.ts";

test("실제 지도는 공동작품을 포함한 19개 부스를 중복 없이 올바른 작품에 연결한다", () => {
  for (const booths of [spaceBooths, mobileSpaceBooths]) {
    assert.equal(booths.length, 19);
    assert.equal(new Set(booths.map(booth => booth.artistKo)).size, 19);
    for (const booth of booths) {
      assert.equal(getSpaceWork(booth.artistKo).artistKo, booth.artistKo);
      assert.ok(booth.x >= 0 && booth.y >= 0);
      assert.ok(booth.x + booth.width <= 100 && booth.y + booth.height <= 100);
    }
  }
  assert.equal(getSpaceWork("박규리 & 이다혜").id, 9);
  assert.equal(getSpaceWork("김서은").id, 4);
  assert.equal(getSpaceWork("김가연").id, 2);
});
