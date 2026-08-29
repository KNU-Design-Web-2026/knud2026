import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const profilePagePath = new URL("./page.tsx", import.meta.url);
const profileCardPath = new URL("../../components/profile/profile-card.tsx", import.meta.url);
const profileMembersPath = new URL("../../data/profile-members.ts", import.meta.url);
const globalStylesPath = new URL("../../styles/globals.css", import.meta.url);

test("Profile 경로는 Figma의 20개 프로필 카드를 렌더한다", () => {
  assert.equal(existsSync(profilePagePath), true);

  const profilePage = readFileSync(profilePagePath, "utf8");

  assert.match(profilePage, /PROFILE_MEMBERS\.map/);
  assert.match(profilePage, /ProfileCard/);
});

test("Profile 카드는 고정 셀 안에서 hover 정보와 확대 상태를 제공한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const profileMembers = readFileSync(profileMembersPath, "utf8");

  assert.match(profileCard, /group\/profile-card/);
  assert.match(profileCard, /profile-card__image/);
  assert.match(profileCard, /member\.nameKo/);
  assert.match(profileCard, /member\.nameEn/);
  assert.match(profileMembers, /nameKo:/);
  assert.match(profileMembers, /nameEn:/);
});

test("Profile hover 이미지는 프레임의 안쪽 경계까지 확대된다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /transform: scale\(1\.064\)/);
});
