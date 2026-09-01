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
  assert.match(profileMembers, /공예원/);
  assert.match(profileMembers, /현연이/);
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
  assert.match(tokens, /--header-height: clamp\(3\.125rem, calc\(12\.5vw \+ 0\.3125rem\), 5rem\)/);
  assert.match(tokens, /--header-title-size: clamp\(0\.5rem, calc\(5vw - 0\.625rem\), 0\.625rem\)/);
});

test("Profile 카드는 기준 폭별 Figma 카드 비율을 유지한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");
  const tokens = readFileSync(tokensPath, "utf8");

  assert.match(profileCard, /profile-card/);
  assert.match(profileCard, /profile-card__surface/);
  assert.match(globalStyles, /aspect-ratio: var\(--profile-card-aspect-ratio\)/);
  assert.match(globalStyles, /left: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /top: var\(--profile-card-padding-y\)/);
  assert.match(tokens, /--profile-card-aspect-ratio: 319 \/ 424/);
  assert.match(tokens, /--profile-card-aspect-ratio: 315 \/ 418/);
  assert.match(tokens, /--profile-card-aspect-ratio: 265 \/ 353/);
  assert.match(tokens, /--profile-card-aspect-ratio: 181 \/ 241/);
});

test("Profile 반응형 hover 프레임과 이름 패널은 하나의 surface를 공유한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /\.profile-card__surface \{[\s\S]*?inset: 0/);
  assert.match(globalStyles, /\.profile-card__surface \{[\s\S]*?transform: scale\(1\)/);
  assert.match(globalStyles, /\.profile-card__surface \{[\s\S]*?transition: transform 1100ms/);
  assert.match(globalStyles, /\.profile-card__surface \{[\s\S]*?left: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /@media \(min-width: 600\.0625px\) \{[\s\S]*?\.profile-card__surface \{[\s\S]*?right: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /\.profile-card:hover \.profile-card__border,[\s\S]*?opacity: 1/);
  assert.match(globalStyles, /\.profile-card:focus-visible \.profile-card__border,[\s\S]*?opacity: 1/);
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

test("Profile Web hover는 프레임·사진·이름 패널을 한 surface로 완만하게 확대한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(profileCard, /justify-start/);
  assert.match(globalStyles, /\.profile-card:hover \.profile-card__surface,[\s\S]*?transform: scale\(1\.064\)/);
  assert.match(globalStyles, /transform: scale\(1\.064\)/);
  assert.match(globalStyles, /프레임·사진·이름 패널을 한 surface로 함께 확대한다/);
});

test("Profile Web hover surface는 기본 이미지 여백 안에서 카드 위치를 유지한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /@media \(min-width: 600\.0625px\) \{[\s\S]*?bottom: var\(--profile-card-padding-y\)/);
  assert.match(globalStyles, /@media \(min-width: 600\.0625px\) \{[\s\S]*?left: var\(--profile-card-padding-x\)/);
});

test("Profile Web hover는 확대된 사진을 프레임 surface 안에서만 표시한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /\.profile-card__surface \{[\s\S]*?overflow: hidden/);
});

test("Profile hover는 프레임과 이름 패널을 동시에 표시한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");
  const profileStyles = globalStyles.split(".header-nav-link__label")[0];

  assert.match(profileStyles, /\.profile-card__border \{[\s\S]*?transition: opacity 520ms/);
  assert.match(globalStyles, /\.profile-card__detail \{[\s\S]*?transition: opacity 520ms/);
  assert.doesNotMatch(profileStyles, /transition-delay:/);
  assert.doesNotMatch(profileStyles, /profile-card__detail \{[\s\S]*?translateY/);
});

test("Profile Web hover 이름 패널은 요청된 낮은 시각 밀도로 좌측 정렬한다", () => {
  const profileCard = readFileSync(profileCardPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(profileCard, /profile-card__detail[\s\S]*?justify-start/);
  assert.match(globalStyles, /--profile-detail-name-size: 1\.5rem/);
  assert.match(globalStyles, /--profile-detail-name-en-size: 1\.125rem/);
  assert.match(globalStyles, /--profile-detail-padding-x: 1\.5rem/);
  assert.match(globalStyles, /--profile-detail-gap: 1\.125rem/);
});

test("Profile 중간 폭 이름 패널은 카드 폭을 기준으로 연속 축소한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /container-type: inline-size/);
  assert.match(globalStyles, /--profile-detail-name-size: clamp\(1rem, 7\.62cqw, 1\.5rem\)/);
  assert.match(globalStyles, /--profile-detail-name-en-size: clamp\(0\.75rem, 5\.72cqw, 1\.125rem\)/);
});

test("공통 헤더는 중간 폭에서 제목과 메뉴 아이콘을 연속적으로 축소한다", () => {
  const header = readFileSync(new URL("../../components/layout/site-header.tsx", import.meta.url), "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");
  const tokens = readFileSync(tokensPath, "utf8");

  assert.match(header, /site-header__brand/);
  assert.match(header, /site-header__title/);
  assert.match(tokens, /--header-height: clamp\(5rem, calc\(5\.3333vw \+ 3rem\), 7\.5rem\)/);
  assert.match(tokens, /--header-menu-size: clamp\(1\.875rem, 7\.5vw, 3rem\)/);
  assert.match(globalStyles, /width: clamp\(1\.2890625rem, 4\.9vw, 2\.0625rem\)/);
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

test("Profile Tab hover는 모바일을 제외하고 하나의 카드 surface를 확대한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(globalStyles, /bottom: var\(--profile-card-padding-y\)/);
  assert.match(globalStyles, /left: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /right: var\(--profile-card-padding-x\)/);
  assert.match(globalStyles, /top: var\(--profile-card-padding-y\)/);
  assert.match(globalStyles, /min-width: 1350\.0625px/);
  assert.match(globalStyles, /min-width: 600\.0625px\) \{/);
  assert.match(globalStyles, /\.profile-card:hover \.profile-card__surface/);
  assert.match(globalStyles, /transform: scale\(1\.064\)/);
});

test("Profile hover는 영상 기준의 완만한 동시 전환을 사용한다", () => {
  const globalStyles = readFileSync(globalStylesPath, "utf8");
  const profileStyles = globalStyles.split(".header-nav-link__label")[0];

  assert.match(globalStyles, /transform 1100ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(profileStyles, /opacity 520ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.doesNotMatch(profileStyles, /transition-delay:/);
});
