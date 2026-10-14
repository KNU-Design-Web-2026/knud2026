import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

test("Archive 사본 40장은 원본 URL·비율·순서를 보존하고 실제 파일 규격과 일치한다", async () => {
  const manifest = JSON.parse(await readFile(new URL("../../data/archive-web-images.json", import.meta.url), "utf8"));
  assert.equal(manifest.length, 40);
  for (const [index, item] of manifest.entries()) {
    assert.equal(item.originalSrc, `https://design-graduation-image.s3.ap-northeast-2.amazonaws.com/archive/${index + 1}.webp`);
    assert.equal(item.src, `/assets/archive/${String(index + 1).padStart(2, "0")}.webp`);
    const file = await readFile(new URL(`../../../public${item.src}`, import.meta.url));
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, item.width);
    assert.equal(metadata.height, item.height);
    assert.equal(file.length, item.bytes);
    assert.ok(item.width <= 1600);
    assert.ok(Math.abs(item.width / item.height - item.originalWidth / item.originalHeight) < 0.005);
    assert.ok(item.bytes < item.originalBytes);
  }
});
