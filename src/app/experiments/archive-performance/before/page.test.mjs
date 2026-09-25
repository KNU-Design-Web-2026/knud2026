import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("./page.module.css", import.meta.url), "utf8");

test("Before 실험은 원본 40장을 즉시 요청하는 기준 조건을 유지한다", () => {
  assert.match(page, /loading="eager"/);
  assert.match(page, /decoding="sync"/);
  assert.match(page, /data-archive-variant="before"/);
  assert.doesNotMatch(page, /from "next\/image"/);
});

test("fixture가 없는 환경에서는 생성 명령을 안내한다", () => {
  assert.match(page, /pnpm perf:archive:before/);
  assert.match(page, /return null/);
});

test("측정 화면은 데스크톱 3열과 좁은 화면 2열을 사용한다", () => {
  assert.match(styles, /column-count: 3/);
  assert.match(styles, /@media \(max-width: 821px\)/);
  assert.match(styles, /column-count: 2/);
});
