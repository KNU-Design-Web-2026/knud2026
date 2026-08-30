import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workPagePath = new URL("./page.tsx", import.meta.url);
const workCardPath = new URL("../../components/work/work-card.tsx", import.meta.url);
const workItemsPath = new URL("../../data/work-items.ts", import.meta.url);
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

  assert.match(card, /pt-3\.5 pb-4 pl-\[1\.125rem\]/);
  assert.doesNotMatch(card, /pr-4/);
  assert.match(card, /tracking-\[-0\.2px\]/);
});

test("Work Web 그리드는 4열·28px 간격·150px 좌우 여백을 유지한다", () => {
  const page = readFileSync(workPagePath, "utf8");

  assert.match(page, /grid-cols-4/);
  assert.match(page, /gap-7/);
  assert.match(page, /px-\[9\.375rem\]/);
  assert.match(page, /pt-20/);
});

test("Work 카드 hover는 영상 기준으로 정보 패널을 노란색으로 부드럽게 전환한다", () => {
  const card = readFileSync(workCardPath, "utf8");
  const styles = readFileSync(globalStylesPath, "utf8");

  assert.match(card, /tabIndex=\{0\}/);
  assert.match(styles, /\.work-card__detail \{[\s\S]*?transition: background-color 420ms cubic-bezier\(0\.16, 1, 0\.3, 1\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.work-card:hover \.work-card__detail \{[\s\S]*?background-color: #fcd519/);
  assert.match(styles, /\.work-card:focus-visible \.work-card__detail \{[\s\S]*?background-color: #fcd519/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.work-card__detail \{[\s\S]*?transition-duration: 1ms/);
});
