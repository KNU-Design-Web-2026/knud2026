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

const expected = { "공예원": [1, 8], "김연수": [6, 4], "김은별": [7, 4], "이초원": [15, 7], "조장원": [18, 6] };

test("제출된 다섯 작가만 썸네일·작품명·연락처·번호순 상세 이미지를 연결한다", () => {
  assert.deepEqual(Object.keys(SUBMITTED_WORKS).sort(), Object.keys(expected).sort());
  for (const [artist, [id, count]] of Object.entries(expected)) {
    const source = SUBMITTED_WORKS[artist];
    const item = WORK_ITEMS.find((work) => work.id === id);
    const detail = WORK_DETAILS[String(id)];
    const profile = PROFILE_SHEET_CONTENT[artist];
    assert.equal(item.artistKo, artist);
    assert.equal(item.imageSrc, source.thumbnail.src);
    assert.equal(item.spaceImageSrc, source.space.src);
    assert.equal(item.title, profile.projectName);
    assert.equal(detail.artistKo, artist);
    assert.equal(detail.email, profile.email);
    assert.equal(detail.instagram, profile.instagram);
    assert.equal(detail.category, profile.tags.join(" / "));
    assert.equal(detail.images.length, count);
    assert.equal(detail.storyKo, WORK_INTRODUCTIONS[artist].storyKo);
    assert.equal(detail.storyEn, WORK_INTRODUCTIONS[artist].storyEn);
    assert.deepEqual(detail.images.map((image) => image.src), [...detail.images.map((image) => image.src)].sort());
    const html = renderToStaticMarkup(React.createElement(WorkDetailPage, { detail }));
    assert.doesNotMatch(html, /PROJECT NAME|잊힌 이들의 기억|instagram\.com\/null/);
    const portfolioImages = html.match(/<img[^>]*작품 상세[^>]*>/g) ?? [];
    assert.equal(portfolioImages.length, count);
    for (const image of portfolioImages) assert.match(image, /loading="lazy"/);
  }
  assert.equal(WORK_ITEMS.filter((item) => item.imageSrc.includes("work-placeholder")).length, 14);
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
