import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./generate-archive-after.mjs", import.meta.url), "utf8");

test("Archive 파생본은 네 가지 표시 폭과 AVIF·WebP를 생성한다", () => {
  assert.match(source, /const widths = \[480, 768, 1080, 1600\]/);
  assert.match(source, /extension: "avif", quality: 60/);
  assert.match(source, /extension: "webp", quality: 75/);
});

test("Archive 파생본은 작은 blur placeholder와 전송량 메타데이터를 기록한다", () => {
  assert.match(source, /resize\(\{ width: 24, withoutEnlargement: true \}\)/);
  assert.match(source, /data:image\/jpeg;base64/);
  assert.match(source, /totalsByFormat/);
});
