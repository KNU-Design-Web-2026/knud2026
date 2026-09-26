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
  assert.match(tokens, /--header-nav-guestbook-width: 11rem/);
  assert.match(tokens, /calc\(1\.4286vw \+ 0\.339rem\)/);
  assert.match(tokens, /calc\(2vw \+ 0\.125rem\)/);
  assert.match(header, /item\.href === "\/message"/);
  assert.match(header, /w-\[var\(--header-nav-guestbook-width\)\]/);
  assert.match(header, /w-\[var\(--header-nav-item-width\)\]/);
  assert.match(header, /42nd KNUD Graduation Exhibition Archive/);
  assert.doesNotMatch(header, /42th KNUD/);
});

test("데스크톱과 모바일 헤더는 메시지 메뉴를 GUESTBOOK으로 표시한다", async () => {
  const header = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");
  const tokens = await readFile(new URL("../../styles/tokens.css", import.meta.url), "utf8");

  assert.equal(header.match(/label: "GUESTBOOK"/g)?.length, 2);
  assert.doesNotMatch(header, /label: "MESSAGE"/);
  assert.match(tokens, /--header-nav-container-width: calc\([\s\S]*?var\(--header-nav-item-width\) \* 4[\s\S]*?var\(--header-nav-guestbook-width\)[\s\S]*?var\(--header-nav-gap\) \* 4/);
});

test("데스크톱과 모바일 헤더는 작품 메뉴를 WORKS로 표시한다", async () => {
  const header = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.equal(header.match(/label: "WORKS"/g)?.length, 2);
  assert.doesNotMatch(header, /label: "WORK"[, }]/);
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

test("1350–1920px 헤더는 노트북 폭에서 텍스트를 축소하고 좌우 여백을 보간한다", async () => {
  const tokens = await readFile(new URL("../../styles/tokens.css", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");
  const header = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");
  const desktop = tokens.match(/@media \(min-width: 1350px\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop);
  for (const token of ["gutter", "height", "logo-width", "logo-height", "brand-gap", "title-size", "nav-item-width", "nav-guestbook-width", "nav-gap", "nav-size", "nav-decoration-width", "nav-decoration-height"]) {
    assert.match(desktop, new RegExp(`--header-${token}: clamp\\([^;]+100vw - 1350px[^;]+/ 570`));
  }
  assert.match(desktop, /--header-gutter: clamp\(75px,[^;]+, 150px\)/);
  assert.match(desktop, /--header-title-size: clamp\(18px,[^;]+, 20px\)/);
  assert.match(desktop, /--header-nav-size: clamp\(22px,[^;]+, 26px\)/);
  assert.match(desktop, /--header-nav-item-width: clamp\(110px,[^;]+, 130px\)/);
  assert.match(desktop, /--header-nav-guestbook-width: clamp\(150px,[^;]+, 176px\)/);
  assert.match(desktop, /--header-nav-gap: clamp\(8px,[^;]+, 12px\)/);
  assert.match(styles, /\.header-nav-link--active::after \{[^}]*width: var\(--header-nav-item-width\)/);
  assert.match(styles, /\.site-header__container \{[^}]*padding-inline: var\(--header-gutter\)/);
  assert.doesNotMatch(header, /1349\.9|1350\.1/);
});

test("600px 헤더의 햄버거 아이콘은 Figma 기준 33px 폭을 확보한다", async () => {
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(styles, /width: clamp\(1\.2890625rem, calc\(6\.1875vw - 0\.2578125rem\), 2\.0625rem\)/);
  assert.match(styles, /height: clamp\(1rem, 4vw, 1\.5rem\)/);
});

test("데스크톱 메뉴의 hover 배경 이미지는 느린 전환으로 표시한다", async () => {
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.header-nav-link__decoration \{[\s\S]*?opacity 620ms/);
  assert.match(styles, /\.header-nav-link:hover \.header-nav-link__decoration[\s\S]*?opacity 700ms/);
});
