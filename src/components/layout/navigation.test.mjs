import assert from "node:assert/strict";
import test from "node:test";
import { getHeaderSpacerBackgroundClass, isNavigationPathActive } from "./navigation.ts";

test("현재 경로와 일치하는 메뉴만 활성 상태로 판별한다", () => {
  assert.equal(isNavigationPathActive("/about", "/about"), true);
  assert.equal(isNavigationPathActive("/about", "/work"), false);
});

test("헤더 보정 배경은 메인 Hero에서만 파란색을 사용한다", () => {
  assert.equal(getHeaderSpacerBackgroundClass("/"), "bg-[#0dadfb]");
  assert.equal(getHeaderSpacerBackgroundClass("/profile"), "bg-white");
  assert.equal(getHeaderSpacerBackgroundClass("/about"), "bg-white");
});
