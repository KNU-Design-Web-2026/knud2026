import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const profilePagePath = new URL("./page.tsx", import.meta.url);
const profileCardPath = new URL("../../components/profile/profile-card.tsx", import.meta.url);
const profileMembersPath = new URL("../../data/profile-members.ts", import.meta.url);
const globalStylesPath = new URL("../../styles/globals.css", import.meta.url);
const tokensPath = new URL("../../styles/tokens.css", import.meta.url);

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

test("Profile Web hover 이미지는 프레임의 안쪽 경계까지 확대된다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /transform: scale\(1\.064\)/);
});

test("Profile 그리드는 Figma 네 기준 폭에서 열 수와 카드 여백을 전환한다", () => {
  const profilePage = readFileSync(profilePagePath, "utf8");
  const tokens = readFileSync(tokensPath, "utf8");

  assert.match(profilePage, /profile-grid/);
  assert.match(tokens, /--profile-grid-columns: 4/);
  assert.match(tokens, /@media \(max-width: 63\.75rem\)[\s\S]*?--profile-grid-columns: 3/);
  assert.match(tokens, /@media \(max-width: 37\.5rem\)[\s\S]*?--profile-grid-columns: 2/);
  assert.match(tokens, /@media \(max-width: 25rem\)[\s\S]*?--profile-grid-gutter: 0\.625rem/);
  assert.match(tokens, /@media \(max-width: 25rem\)[\s\S]*?--header-height: 3\.6875rem/);
});

test("Profile 카드는 기준 폭별 Figma 카드 비율을 유지한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");
  const tokens = readFileSync(tokensPath, "utf8");

  assert.match(profileCard, /profile-card/);
  assert.match(globalStyles, /aspect-ratio: var\(--profile-card-aspect-ratio\)/);
  assert.match(profileCard, /--profile-card-padding-x/);
  assert.match(profileCard, /--profile-card-padding-y/);
  assert.match(tokens, /--profile-card-aspect-ratio: 319 \/ 424/);
  assert.match(tokens, /--profile-card-aspect-ratio: 315 \/ 418/);
  assert.match(tokens, /--profile-card-aspect-ratio: 265 \/ 353/);
  assert.match(tokens, /--profile-card-aspect-ratio: 181 \/ 241/);
});

test("Profile 반응형 hover 프레임은 실제 프로필 이미지 외곽에 맞춘다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /\.profile-card__border \{[\s\S]*?height: calc\(100% - \(var\(--profile-card-padding-y\) \* 2\)\)/);
  assert.match(globalStyles, /\.profile-card__border \{[\s\S]*?left: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /\.profile-card__border \{[\s\S]*?width: calc\(100% - \(var\(--profile-card-padding-x\) \* 2\)\)/);
  assert.match(profileCard, /profile-card__detail pointer-events-none absolute inset-x-0 bottom-0/);
});

test("Profile hover 이름 패널은 Figma 기준 폭마다 타이포그래피를 축소한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const tokens = readFileSync(tokensPath, "utf8");

  assert.match(profileCard, /--profile-detail-name-size/);
  assert.match(profileCard, /--profile-detail-name-en-size/);
  assert.match(tokens, /--profile-detail-name-size: 2rem/);
  assert.match(tokens, /@media \(max-width: 84\.375rem\)[\s\S]*?--profile-detail-name-size: 1\.5rem/);
  assert.match(tokens, /@media \(max-width: 37\.5rem\)[\s\S]*?--profile-detail-name-size: 1\.375rem/);
  assert.match(tokens, /@media \(max-width: 25rem\)[\s\S]*?--profile-detail-name-size: 1rem/);
});

test("Profile 터치 구간은 확대 없이 해당 폭의 Figma 외곽 프레임을 사용한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(profileCard, /profile-hover-border-tab-mobile\.svg/);
  assert.match(profileCard, /profile-hover-border-mobile\.svg/);
  assert.match(profileCard, /profile-hover-border-web-tab\.svg/);
  assert.match(profileCard, /profile-hover-border-tab\.svg/);
  assert.match(globalStyles, /min-width: 600\.0625px/);
  assert.match(globalStyles, /max-width: 600px/);
  assert.match(globalStyles, /max-width: 400px/);
});

test("Profile Tab hover는 모바일을 제외하고 이미지와 프레임을 함께 확대한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /bottom: var\(--profile-card-padding-y\)/);
  assert.match(globalStyles, /left: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /right: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /top: var\(--profile-card-padding-y\)/);
  assert.match(globalStyles, /width: auto/);
  assert.match(globalStyles, /min-width: 1350\.0625px/);
  assert.match(globalStyles, /min-width: 600\.0625px\) and \(max-width: 1350px\)/);
  assert.match(globalStyles, /\.profile-card:hover \.profile-card__border/);
  assert.match(globalStyles, /transform: scale\(1\.064\)/);
});

test("Profile hover는 영상 기준의 완만한 순차 전환을 사용한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /transform 1100ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(globalStyles, /opacity 420ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(globalStyles, /transform 900ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(globalStyles, /transition-delay: 100ms/);
  assert.match(globalStyles, /transition-delay: 160ms/);
});
