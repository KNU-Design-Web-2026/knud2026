import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const profilePagePath = new URL("./page.tsx", import.meta.url);

test("Profile 경로는 Figma의 20개 프로필 카드를 렌더한다", () => {
  assert.equal(existsSync(profilePagePath), true);

  const profilePage = readFileSync(profilePagePath, "utf8");

  assert.match(profilePage, /PROFILE_MEMBERS\.map/);
  assert.match(profilePage, /ProfileCard/);
});
