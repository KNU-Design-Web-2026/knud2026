import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const profileCardPath = new URL("../../components/profile/profile-card.tsx", import.meta.url);
const detailComponentPath = new URL("../../components/profile/profile-detail-page.tsx", import.meta.url);
const detailDataPath = new URL("../../data/profile-details.ts", import.meta.url);
const detailRoutePath = new URL("./[id]/page.tsx", import.meta.url);

test("첫 번째 프로필 카드는 상세 초안 경로로 이동한다", async () => {
  const profileCard = await readFile(profileCardPath, "utf8");

  assert.match(profileCard, /member\.id === 1/);
  assert.match(profileCard, /href=\{`\/profile\/\$\{member\.id\}`\}/);
});

test("상세 초안은 Figma 원본 자산과 Web 섹션 구조를 사용한다", async () => {
  const [component, data] = await Promise.all([
    readFile(detailComponentPath, "utf8"),
    readFile(detailDataPath, "utf8"),
  ]);

  assert.match(data, /profile-01\.jpeg/);
  assert.match(data, /profile-01-work-01\.png/);
  assert.match(component, /grid-cols-\[31\.25rem_minmax\(0,1fr\)\]/);
  assert.match(component, /h-\[42\.6875rem\] w-\[31\.25rem\]/);
  assert.match(component, /w-\[16\.875rem\] flex-col gap-2\.5/);
  assert.match(component, /flex flex-col gap-\[3\.75rem\]/);
  assert.match(component, /grid grid-cols-2 gap-\[4\.75rem\]/);
  assert.match(component, /profile-detail-work/);
  assert.match(component, /PROJECT NAME/);
  assert.match(component, /Interview/);
  assert.match(component, /Work/);
});

test("Work 이미지는 영상 기준의 오버레이와 제목 전환을 제공한다", async () => {
  const styles = await readFile(new URL("../../styles/globals.css", import.meta.url), "utf8");

  assert.match(styles, /\.profile-detail-work__overlay \{[\s\S]*?background: rgb\(0 0 0 \/ 0\.6\)/);
  assert.match(styles, /\.profile-detail-work__overlay \{[\s\S]*?font-size: 2\.5rem/);
  assert.match(styles, /\.profile-detail-work__overlay \{[\s\S]*?transition: opacity 650ms/);
  assert.match(styles, /\.profile-detail-work:hover \.profile-detail-work__overlay \{[\s\S]*?opacity: 1/);
  assert.match(styles, /\.profile-detail-work:focus-visible \.profile-detail-work__overlay \{[\s\S]*?opacity: 1/);
});

test("상세 페이지는 Figma 기준 폭에서 콘텐츠 구성을 전환한다", async () => {
  const [component, styles] = await Promise.all([
    readFile(detailComponentPath, "utf8"),
    readFile(new URL("../../styles/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /profile-detail__intro/);
  assert.match(component, /profile-detail__portrait/);
  assert.match(component, /profile-detail__interview-item/);
  assert.doesNotMatch(component, /!px-\[9\.375rem\]/);
  assert.match(styles, /@media \(max-width: 1350px\)[\s\S]*?flex: 0 0 23\.3125rem/);
  assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*?flex-wrap: nowrap/);
  assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*?calc\(34\.444vw - 0\.243rem\)/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?flex-basis: 11\.8125rem/);
  assert.match(styles, /@media \(max-width: 400px\)[\s\S]*?flex-basis: 7\.9375rem/);
  assert.match(styles, /@media \(min-width: 600\.0625px\) and \(max-width: 740px\)[\s\S]*?align-items: flex-start/);
  assert.match(styles, /@media \(min-width: 400\.0625px\) and \(max-width: 460px\)[\s\S]*?align-items: flex-start/);
  assert.match(styles, /aspect-ratio: 1\.8/);
});

test("상세 소개와 인터뷰 답변은 운영 글자 수 제한을 표현한다", async () => {
  const data = await readFile(detailDataPath, "utf8");

  assert.match(data, /introduction: \{ min: 80, max: 100 \}/);
  assert.match(data, /interviewAnswer: \{ min: 100, max: 200 \}/);
  assert.match(data, /isProfileTextLengthValid/);
});

test("존재하지 않는 프로필 식별자는 404 처리한다", async () => {
  const route = await readFile(detailRoutePath, "utf8");

  assert.match(route, /notFound\(\)/);
  assert.match(route, /PROFILE_DETAILS\[id\]/);
});
