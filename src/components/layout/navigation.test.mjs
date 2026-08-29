import assert from "node:assert/strict";
import test from "node:test";
import { isNavigationPathActive } from "./navigation.ts";

test("현재 경로와 일치하는 메뉴만 활성 상태로 판별한다", () => {
  assert.equal(isNavigationPathActive("/about", "/about"), true);
  assert.equal(isNavigationPathActive("/about", "/work"), false);
});
