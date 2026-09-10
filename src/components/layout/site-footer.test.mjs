import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("공통 푸터는 최신 전시 종료일과 SPACE 9 장소명을 모든 페이지에 제공한다", async () => {
  const footer = await readFile(new URL("./site-footer.tsx", import.meta.url), "utf8");

  assert.match(footer, /2026\.10\.20 TUE — 2026\.10\.30 FRI/);
  assert.match(footer, /경북대학교 SPACE 9/);
  assert.doesNotMatch(footer, /2026\.10\.31 SAT/);
});
