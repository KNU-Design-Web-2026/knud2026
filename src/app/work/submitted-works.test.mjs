import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { WORK_ITEMS } from "../../data/work-items.ts";
import { WORK_DETAILS } from "../../data/work-details.ts";
import { SUBMITTED_WORKS } from "../../data/submitted-works.ts";
import { PROFILE_SHEET_CONTENT } from "../../data/profile-sheet-content.ts";
import { WorkDetailPage } from "../../components/work/work-detail-page.tsx";
import { WORK_INTRODUCTIONS } from "../../data/work-introductions.ts";

const expected = {
  "공예원": [1, 8], "김연수": [6, 4], "김은별": [7, 4], "이초원": [15, 7], "조장원": [18, 6],
  "김가연": [2, 37], "김민주": [3, 13], "박수정": [10, 11], "양혜연": [11, 7], "윤이지": [12, 12],
  "이서윤": [14, 16], "이하늘": [16, 5], "임경민": [17, 7], "현연이": [19, 8],
};

test("1·2차 반영 대상 14명의 썸네일·작품명·연락처·번호순 상세 이미지를 연결한다", () => {
  assert.deepEqual(Object.keys(SUBMITTED_WORKS).sort(), Object.keys(expected).sort());
  for (const [artist, [id, count]] of Object.entries(expected)) {
    const source = SUBMITTED_WORKS[artist];
    const item = WORK_ITEMS.find((work) => work.id === id);
    const detail = WORK_DETAILS[String(id)];
    const profile = PROFILE_SHEET_CONTENT[artist];
    assert.equal(item.artistKo, artist);
    assert.equal(item.imageSrc, source.thumbnail.src);
    assert.equal(item.spaceImageSrc, source.space.src);
    const titleOverrides = { "임경민": "대구 떡볶이 페스티벌", "양혜연": "MOOEE" };
    assert.equal(item.title, titleOverrides[artist] ?? profile.projectName);
    assert.equal(detail.artistKo, artist);
    assert.equal(detail.email, profile.email);
    assert.equal(detail.instagram, profile.instagram);
    assert.equal(detail.category, profile.tags.join(" / "));
    assert.equal(detail.images.length, count);
    assert.equal(detail.storyKo, WORK_INTRODUCTIONS[artist]?.storyKo ?? "");
    assert.equal(detail.storyEn, WORK_INTRODUCTIONS[artist]?.storyEn ?? "");
    assert.deepEqual(detail.images.map((image) => image.src), [...detail.images.map((image) => image.src)].sort());
    const html = renderToStaticMarkup(React.createElement(WorkDetailPage, { detail }));
    assert.doesNotMatch(html, /PROJECT NAME|잊힌 이들의 기억|instagram\.com\/null/);
    const portfolioImages = html.match(/<img[^>]*작품 상세[^>]*>/g) ?? [];
    assert.equal(portfolioImages.length, count);
    for (const image of portfolioImages) assert.match(image, /loading="lazy"/);
  }
  assert.equal(WORK_ITEMS.filter((item) => item.imageSrc.includes("work-placeholder")).length, 5);
});

test("이나경 2차 이미지는 제외하되 기존 작품 소개와 프로필 데이터는 유지한다", () => {
  assert.equal(SUBMITTED_WORKS["이나경"], undefined);
  const item = WORK_ITEMS.find(work => work.id === 13);
  const detail = WORK_DETAILS["13"];
  assert.equal(item.artistKo, "이나경");
  assert.equal(item.imageSrc, "/assets/figma/work/work-placeholder.png");
  assert.equal(item.spaceImageSrc, "/assets/figma/work/work-placeholder.png");
  assert.equal(detail.images, undefined);
  assert.equal(detail.heroSrc, "/assets/figma/work/work-detail-hero.png");
  assert.equal(detail.storyKo, WORK_INTRODUCTIONS["이나경"].storyKo);
  assert.equal(detail.email, PROFILE_SHEET_CONTENT["이나경"].email);
});

test("웹 이미지의 실제 규격이 매니페스트와 같고 원본 비율을 유지한다", async () => {
  for (const work of Object.values(SUBMITTED_WORKS)) {
    for (const image of [work.thumbnail, work.space, work.hero, ...work.images]) {
      const file = new URL(`../../../public${image.src}`, import.meta.url);
      assert.ok(existsSync(file));
      const metadata = await sharp(file.pathname).metadata();
      assert.equal(metadata.width, image.width);
      assert.equal(metadata.height, image.height);
      assert.ok(image.width <= 1920);
    }
  }
});
