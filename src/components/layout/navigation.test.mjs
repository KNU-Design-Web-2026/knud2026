import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getHeaderSpacerBackgroundClass, isNavigationPathActive } from "./navigation.ts";

test("현재 경로와 해당 메뉴의 상세 경로에서 메뉴를 활성 상태로 판별한다", () => {
  assert.equal(isNavigationPathActive("/about", "/about"), true);
  assert.equal(isNavigationPathActive("/about", "/work"), false);
  assert.equal(isNavigationPathActive("/profile/1", "/profile"), true);
  assert.equal(isNavigationPathActive("/work/1", "/work"), true);
  assert.equal(isNavigationPathActive("/profile/1", "/work"), false);
});

test("헤더 보정 배경은 파란색 Hero가 바로 이어지는 경로에서 같은 색을 사용한다", () => {
  assert.equal(getHeaderSpacerBackgroundClass("/"), "bg-[#0dadfb]");
  assert.equal(getHeaderSpacerBackgroundClass("/profile"), "bg-white");
  assert.equal(getHeaderSpacerBackgroundClass("/about"), "bg-[#06affd]");
});

test("작은 모바일 폭에서는 커스텀 커서를 활성화하지 않는다", async () => {
  const cursor = await readFile(new URL("./site-cursor.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(cursor, /min-width: 600\.0625px/);
  assert.match(cursor, /addEventListener\("change", syncCursorMode\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\) and \(min-width: 600\.0625px\)/);
});

test("공통 헤더는 변경된 Figma 기준 폭의 브랜드와 메뉴 타이포그래피를 유지한다", async () => {
  const tokens = await readFile(new URL("../../styles/tokens.css", import.meta.url), "utf8");
  const header = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(tokens, /--page-gutter: 9\.375rem/);
  assert.match(tokens, /--header-logo-width: 8\.125rem/);
  assert.match(tokens, /--header-logo-height: 4\.75rem/);
  assert.match(tokens, /--header-brand-gap: 2\.125rem/);
  assert.match(tokens, /--header-nav-size: 1\.75rem/);
  assert.match(tokens, /--header-nav-item-width: 8\.625rem/);
  assert.match(tokens, /calc\(1\.4286vw \+ 0\.339rem\)/);
  assert.match(tokens, /calc\(2vw \+ 0\.125rem\)/);
  assert.match(header, /w-\[var\(--header-nav-item-width\)\]/);
});

test("600px 헤더의 햄버거 아이콘은 Figma 기준 33px 폭을 확보한다", async () => {
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(styles, /width: clamp\(1\.2890625rem, calc\(6\.1875vw - 0\.2578125rem\), 2\.0625rem\)/);
  assert.match(styles, /height: clamp\(1rem, 4vw, 1\.5rem\)/);
});

test("모바일 메뉴의 현재 페이지는 전체 항목을 노란색 배경으로 표시한다", async () => {
  const header = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(header, /isActive && "bg-knud-navigation-active font-normal text-knud-ink"/);
  assert.doesNotMatch(header, /isActive && "font-bold text-knud-navigation-active after:/);
  const activeStyles = styles.match(/\.mobile-menu-panel__item\[aria-current="page"\] \{([^}]+)\}/)?.[1];
  assert.ok(activeStyles);
  assert.match(activeStyles, /color: var\(--color-knud-ink\);/);
  assert.doesNotMatch(activeStyles, /font-size|line-height|letter-spacing/);
});
