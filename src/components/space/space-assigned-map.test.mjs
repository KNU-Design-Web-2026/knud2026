import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
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

test("지도는 확대 가능한 순수 벡터이며 모든 이름 링크가 해당 글자 마스크와 겹친다", async () => {
  for (const [name, booths, width, height] of [
    ["map-assigned-2026", spaceBooths, 560, 396],
    ["map-assigned-mobile-2026", mobileSpaceBooths, 384, 542],
  ]) {
    const base = new URL(`../../../public/assets/figma/space/${name}`, import.meta.url);
    const svg = await readFile(`${base.pathname}.svg`, "utf8");
    // An SVG wrapping an embedded PNG would retain the original blur.
    assert.doesNotMatch(svg, /<image\b|<text\b|<script\b|https?:\/\/(?!www\.w3\.org)/);
    const metadata = await sharp(Buffer.from(svg)).metadata();
    assert.equal(metadata.format, "svg");
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);

    const { data, info } = await sharp(`${base.pathname}-name-mask.png`)
      .greyscale().raw().toBuffer({ resolveWithObject: true });
    assert.ok(info.width >= width * 4, "hover mask must remain sharp at high DPR");
    for (const booth of booths) {
      const left = Math.floor(booth.x / 100 * info.width);
      const top = Math.floor(booth.y / 100 * info.height);
      const right = Math.ceil((booth.x + booth.width) / 100 * info.width);
      const bottom = Math.ceil((booth.y + booth.height) / 100 * info.height);
      let lettering = 0;
      let background = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const value = data[y * info.width + x];
          if (value >= 200) lettering++;
          if (value === 0) background++;
        }
      }
      assert.ok(lettering > 0, `${name}: ${booth.artistKo} hit area must contain lettering`);
      assert.ok(background > lettering, `${name}: ${booth.artistKo} must not fade a rectangular box`);
    }
  }
});
