import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workPagePath = new URL("./page.tsx", import.meta.url);
const workCardPath = new URL("../../components/work/work-card.tsx", import.meta.url);
const workItemsPath = new URL("../../data/work-items.ts", import.meta.url);
const workDetailDataPath = new URL("../../data/work-details.ts", import.meta.url);
const workDetailRoutePath = new URL("./[id]/page.tsx", import.meta.url);
const workDetailPagePath = new URL("../../components/work/work-detail-page.tsx", import.meta.url);
const globalStylesPath = new URL("../../styles/globals.css", import.meta.url);

test("Work 경로는 Figma Web 기준의 19개 작품 카드를 렌더한다", () => {
  assert.equal(existsSync(workPagePath), true);

  const page = readFileSync(workPagePath, "utf8");
  const items = readFileSync(workItemsPath, "utf8");

  assert.match(page, /WORK_ITEMS\.map/);
  assert.match(page, /WorkCard/);
  assert.match(items, /\{ length: 19 \}/);
});

test("Work 카드는 원본 Figma 이미지와 작품 정보 패널을 사용한다", () => {
  const card = readFileSync(workCardPath, "utf8");
  const items = readFileSync(workItemsPath, "utf8");

  assert.match(card, /work-card__image/);
  assert.match(card, /work-card__detail/);
  assert.match(card, /item\.title/);
  assert.match(card, /item\.artistKo/);
  assert.match(card, /item\.artistEn/);
  assert.match(items, /work-placeholder\.png/);
  assert.equal(existsSync(new URL("../../../public/assets/figma/work/work-placeholder.png", import.meta.url)), true);
});

test("Work 카드 정보 패널은 Figma 컴포넌트의 자간과 여백을 따른다", () => {
  const card = readFileSync(workCardPath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(card, /work-card__detail/);
  assert.match(card, /work-card__title/);
  assert.match(styles, /\.work-card__detail \{[\s\S]*?letter-spacing: -0\.2px;[\s\S]*?padding: 0\.875rem 0 1rem 1\.125rem/);
});

test("Work Web 그리드는 4열·28px 간격·150px 좌우 여백을 유지한다", () => {
  const page = readFileSync(workPagePath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(page, /work-page/);
  assert.match(page, /work-grid/);
  assert.match(styles, /\.work-page \{[\s\S]*?padding-top: 5rem/);
  assert.match(styles, /\.work-grid \{[\s\S]*?column-gap: 1\.75rem;[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?padding-inline: 9\.375rem;[\s\S]*?row-gap: 2\.25rem/);
});

test("Work 그리드는 Figma의 네 기준 폭에 맞춰 열 수·여백·간격을 전환한다", () => {
  const page = readFileSync(workPagePath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(page, /work-grid/);
  assert.match(styles, /\.work-grid \{[\s\S]*?column-gap: 1\.75rem;[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?padding-inline: 9\.375rem;[\s\S]*?row-gap: 2\.25rem/);
  assert.match(styles, /@media \(max-width: 84\.375rem\) \{[\s\S]*?\.work-grid \{[\s\S]*?column-gap: 1\.1875rem;[\s\S]*?padding-inline: 3\.125rem;[\s\S]*?row-gap: 1\.875rem/);
  assert.match(styles, /@media \(max-width: 63\.75rem\) \{[\s\S]*?\.work-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?row-gap: 1\.75rem/);
  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.work-grid \{[\s\S]*?column-gap: 1rem;[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?padding-inline: 1\.25rem;[\s\S]*?row-gap: 1\.375rem/);
  assert.match(styles, /@media \(max-width: 25rem\) \{[\s\S]*?\.work-grid \{[\s\S]*?column-gap: 0\.625rem;[\s\S]*?padding-inline: 0\.625rem;[\s\S]*?row-gap: 0\.875rem/);
});

test("Work 600~740px 구간은 작가명 넘침을 막기 위해 두 열을 유지한다", () => {
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(styles, /@media \(max-width: 46\.25rem\) \{[\s\S]*?\.work-grid \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Work 카드 정보 패널은 기준 폭별 Figma 타이포그래피와 여백을 사용한다", () => {
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(styles, /@media \(max-width: 84\.375rem\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?padding: 0\.75rem 0 0\.875rem 1rem;[\s\S]*?\.work-card__title \{[\s\S]*?font-size: 1\.375rem/);
  assert.match(styles, /@media \(max-width: 63\.75rem\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?padding-left: 0\.875rem/);
  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?gap: 0\.25rem;[\s\S]*?padding: 0\.625rem 0 0\.75rem 0\.875rem;[\s\S]*?\.work-card__title \{[\s\S]*?font-size: 1\.25rem/);
  assert.match(styles, /@media \(max-width: 25rem\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?gap: 0\.125rem;[\s\S]*?padding: 0\.375rem 0 0\.5rem 0\.625rem;[\s\S]*?\.work-card__title \{[\s\S]*?font-size: 0\.875rem/);
});

test("Work 카드 hover는 느린 이징으로 정보 패널을 부드럽게 전환한다", () => {
  const card = readFileSync(workCardPath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(card, /className="work-card"/);
  assert.match(styles, /\.work-card__detail \{[\s\S]*?transition: background-color 700ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.work-card:hover \.work-card__detail \{[\s\S]*?background-color: #fcd519/);
  assert.match(styles, /\.work-card:focus-visible \.work-card__detail \{[\s\S]*?background-color: #fcd519/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?transition-duration: 1ms/);
});

test("Work 카드는 각 작품의 상세 경로로 이동한다", () => {
  const card = readFileSync(workCardPath, "utf8");

  assert.match(card, /import Link from "next\/link"/);
  assert.match(card, /href=\{`\/work\/\$\{item\.id\}`\}/);
});

test("Work 상세 경로는 Figma Web 상세 데이터와 화면을 사용한다", () => {
  assert.equal(existsSync(workDetailRoutePath), true);
  assert.equal(existsSync(workDetailPagePath), true);
  assert.equal(existsSync(workDetailDataPath), true);

  const route = readFileSync(workDetailRoutePath, "utf8");
  const detail = readFileSync(workDetailPagePath, "utf8");
  const data = readFileSync(workDetailDataPath, "utf8");

  assert.match(route, /notFound/);
  assert.match(route, /WorkDetailPage/);
  assert.match(detail, /work-detail__hero/);
  assert.match(detail, /work-detail__story/);
  assert.match(detail, /SiteFooter/);
  assert.match(data, /work-detail-hero\.png/);
  assert.equal(existsSync(new URL("../../../public/assets/figma/work/work-detail-hero.png", import.meta.url)), true);
});

test("Work Web 상세는 Figma의 1920px 컨테이너·150px 여백·2열 본문 규격을 따른다", () => {
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(styles, /\.work-detail \{[\s\S]*?min-width: 0;[\s\S]*?overflow-x: clip/);
  assert.match(styles, /\.work-detail__content \{[\s\S]*?padding-inline: 9\.375rem/);
  assert.match(styles, /\.work-detail__story \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?gap: 2\.5rem/);
});

test("Work 상세은 1350px·1020px 기준에서 Figma의 본문 폭과 타이포그래피로 축소된다", () => {
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(styles, /@media \(max-width: 84\.375rem\) \{[\s\S]*?\.work-detail__content \{[\s\S]*?padding: 5rem 3\.125rem/);
  assert.match(styles, /@media \(max-width: 84\.375rem\) \{[\s\S]*?\.work-detail__title-group h1 \{[\s\S]*?font-size: 3\.75rem/);
  assert.match(styles, /@media \(max-width: 63\.75rem\) \{[\s\S]*?\.work-detail__content \{[\s\S]*?padding: 3\.75rem 3\.125rem/);
  assert.match(styles, /@media \(max-width: 63\.75rem\) \{[\s\S]*?\.work-detail__story \{[\s\S]*?gap: 2rem/);
});

test("Work 상세은 600px에서 정보·소개문 2열, 480px 이하에서는 모바일 세로 구조로 전환한다", () => {
  const detail = readFileSync(workDetailPagePath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(detail, /work-detail__identity/);
  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.work-detail__content \{[\s\S]*?grid-template-columns: 10\.625rem minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.work-detail__content \{[\s\S]*?gap: 3rem/);
  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.work-detail__story \{[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1/);
  assert.match(styles, /@media \(max-width: 30rem\) \{[\s\S]*?\.work-detail__content \{[\s\S]*?display: flex/);
  assert.match(styles, /@media \(max-width: 30rem\) \{[\s\S]*?\.work-detail__story \{[\s\S]*?grid-column: auto;[\s\S]*?grid-row: auto/);
});
