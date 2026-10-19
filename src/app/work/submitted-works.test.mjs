import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import { WORK_ITEMS } from "../../data/work-items.ts";
import { WORK_DETAILS } from "../../data/work-details.ts";
import { SUBMITTED_WORKS } from "../../data/submitted-works.ts";
import { PROFILE_SHEET_CONTENT } from "../../data/profile-sheet-content.ts";
import { renderWorkDetail } from "./fixtures/render-work-detail.mjs";
import { WORK_INTRODUCTIONS } from "../../data/work-introductions.ts";

const expected = {
  "공예원": [1, 8], "김연수": [6, 4], "김은별": [7, 4], "이초원": [15, 7], "조장원": [18, 6],
  "김가연": [2, 37], "김민주": [3, 13], "박수정": [10, 11], "양혜연": [11, 7], "윤이지": [12, 12],
  "이서윤": [14, 16], "이하늘": [16, 5], "임경민": [17, 7], "현연이": [19, 8],
  "김세직": [5, 9], "김지언": [8, 13], "박규리 & 이다혜": [9, 9],
};

test("반영 대상 17개 작품의 썸네일·작품명·연락처·번호순 상세 이미지를 연결한다", () => {
  assert.deepEqual(Object.keys(SUBMITTED_WORKS).sort(), Object.keys(expected).sort());
  for (const [artist, [id, count]] of Object.entries(expected)) {
    const source = SUBMITTED_WORKS[artist];
    const item = WORK_ITEMS.find((work) => work.id === id);
    const detail = WORK_DETAILS[String(id)];
    const profile = PROFILE_SHEET_CONTENT[artist.split(" & ")[0]];
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
    const html = renderWorkDetail(detail);
    assert.doesNotMatch(html, /PROJECT NAME|잊힌 이들의 기억|instagram\.com\/null/);
    const portfolioImages = html.match(/<img[^>]*작품 상세[^>]*>/g) ?? [];
    assert.equal(portfolioImages.length, count);
    for (const image of portfolioImages) {
      assert.match(image, /loading="lazy"/);
      if (!image.includes(".gif")) {
        assert.match(image, /q=95/);
        assert.match(image, /srcSet=/);
      }
      assert.match(image, /background-image:/);
    }
  }
  assert.equal(WORK_ITEMS.filter((item) => item.imageSrc.includes("work-placeholder")).length, 1);
});

test("김지언의 두 번째 상세는 GIF를 직접 제공하고 모션 감소용 정지본을 연결한다", async () => {
  const detail = WORK_DETAILS["8"];
  const image = detail.images[1];
  assert.equal(image.animated, true);
  assert.match(image.src, /portfolio-002\.gif$/);
  const metadata = await sharp(new URL(`../../../public${image.src}`, import.meta.url).pathname).metadata();
  assert.equal(metadata.pages, 207);
  const html = renderWorkDetail(detail);
  assert.match(html, /media="\(prefers-reduced-motion: reduce\)"/);
  assert.ok(html.includes(`src="${image.src}"`));
  assert.ok(html.includes(image.stillSrc));
});

test("이나경은 승인된 Work 썸네일만 사용하고 SPACE·상세 이미지는 제외한다", async () => {
  assert.equal(SUBMITTED_WORKS["이나경"], undefined);
  const item = WORK_ITEMS.find(work => work.id === 13);
  const detail = WORK_DETAILS["13"];
  assert.equal(item.artistKo, "이나경");
  assert.equal(item.imageSrc, "/assets/works/lee-nagyeong/thumbnail.webp");
  const thumbnail = await sharp(new URL(`../../../public${item.imageSrc}`, import.meta.url).pathname).metadata();
  assert.equal(thumbnail.width, 1536);
  assert.equal(thumbnail.height, 1121);
  assert.equal(item.spaceImageSrc, "/assets/figma/work/work-placeholder.png");
  assert.equal(detail.images, undefined);
  assert.equal(detail.heroSrc, "/assets/figma/work/work-detail-hero.png");
  assert.equal(detail.storyKo, WORK_INTRODUCTIONS["이나경"].storyKo);
  assert.equal(detail.email, PROFILE_SHEET_CONTENT["이나경"].email);
});

test("웹 이미지의 실제 규격이 매니페스트와 같고 원본 비율을 유지한다", async () => {
  for (const work of Object.values(SUBMITTED_WORKS)) {
    for (const [image, limit] of [[work.thumbnail, 1536], [work.space, 1248], [work.hero, 3840], ...work.images.map(image => [image, 3840])]) {
      const file = new URL(`../../../public${image.src}`, import.meta.url);
      assert.ok(existsSync(file));
      const metadata = await sharp(file.pathname).metadata();
      assert.equal(metadata.width, image.width);
      assert.equal(metadata.height, image.height);
      assert.equal(image.width, Math.min(image.originalWidth, limit));
      assert.ok(Math.abs(image.height - image.originalHeight * image.width / image.originalWidth) <= 1);
      assert.match(image.blurDataURL, /^data:image\/webp;base64,/);
      assert.ok(Buffer.byteLength(image.blurDataURL) < 1024, `${work.artist} preview payload`);
      const preview = await sharp(Buffer.from(image.blurDataURL.split(",")[1], "base64")).metadata();
      assert.ok(preview.width <= 16 && preview.height <= 16);
    }
  }
});
