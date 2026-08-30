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

test("헤더 보정 배경은 메인 Hero에서만 파란색을 사용한다", () => {
  assert.equal(getHeaderSpacerBackgroundClass("/"), "bg-[#0dadfb]");
  assert.equal(getHeaderSpacerBackgroundClass("/profile"), "bg-white");
  assert.equal(getHeaderSpacerBackgroundClass("/about"), "bg-white");
});

test("작은 모바일 폭에서는 커스텀 커서를 활성화하지 않는다", async () => {
  const cursor = await readFile(new URL("./site-cursor.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(cursor, /min-width: 600\.0625px/);
  assert.match(cursor, /addEventListener\("change", syncCursorMode\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\) and \(min-width: 600\.0625px\)/);
});
