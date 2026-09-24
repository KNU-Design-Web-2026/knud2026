import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("공통 푸터는 최신 전시 종료일과 SPACE 9 장소명을 모든 페이지에 제공한다", async () => {
  const footer = await readFile(new URL("./site-footer.tsx", import.meta.url), "utf8");

  assert.match(footer, /2026\.10\.20 TUE — 2026\.10\.30 FRI/);
  assert.match(footer, /42nd KNUD/);
  assert.match(footer, /경북대학교 SPACE 9/);
  assert.doesNotMatch(footer, /2026\.10\.31 SAT/);
  assert.doesNotMatch(footer, /42th KNUD/);
  assert.doesNotMatch(footer, /underline(?:-offset-2)?/);
});

test("400px 모바일 푸터는 Figma의 두 열 배치와 고정 줄바꿈을 유지한다", async () => {
  const footer = await readFile(new URL("./site-footer.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(footer, /site-footer__copyright-line/);
  assert.equal(footer.match(/site-footer__brand-line/g)?.length, 5);
  assert.match(footer, /© 2026 Kyungpook National University VCD\./);
  assert.match(footer, /All rights Reserved\./);
  assert.match(styles, /@media \(max-width: 25rem\)[\s\S]*?padding: 1\.5625rem 0\.625rem;/);
  assert.match(styles, /\.site-footer__content \{[\s\S]*?grid-template-columns: 6\.8125rem minmax\(0, 1fr\);/);
  assert.match(styles, /\.site-footer__copyright-line \{[\s\S]*?display: block;/);
  assert.match(styles, /\.site-footer__brand-line \{[\s\S]*?display: block;/);
  assert.match(styles, /\.site-footer__brand-copy \{[\s\S]*?line-height: 1rem;/);
});

test("400px 미만 푸터는 열 간격과 정보 글자를 함께 축소해 가로 넘침을 막는다", async () => {
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(styles, /column-gap: clamp\(0\.5rem, calc\(37\.5vw - 7rem\), 2\.375rem\);/);
  assert.match(styles, /font-size: clamp\(0\.5625rem, calc\(2\.5vw \+ 0\.0625rem\), 0\.6875rem\);/);
  assert.match(styles, /font-size: clamp\(0\.625rem, calc\(2\.5vw \+ 0\.125rem\), 0\.75rem\);/);
});
