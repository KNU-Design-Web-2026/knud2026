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
  "이나경": [13, 11], "김서은": [4, 5],
};

test("전체 19개 작품의 썸네일·작품명·연락처·번호순 상세 이미지를 연결한다", () => {
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
      assert.match(image, /background-image:url\(&quot;data:image\/webp;base64,/);
      assert.doesNotMatch(image, /data:image\/svg\+xml/);
    }
  }
  assert.equal(WORK_ITEMS.filter((item) => item.imageSrc.includes("work-placeholder")).length, 0);
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

test("이나경은 이전 제출본의 WORK·SPACE·대표·본문 11개를 함께 연결한다", async () => {
  assert.ok(SUBMITTED_WORKS["이나경"]);
  const item = WORK_ITEMS.find(work => work.id === 13);
  const detail = WORK_DETAILS["13"];
  assert.equal(item.artistKo, "이나경");
  assert.equal(item.imageSrc, "/assets/works/lee-nagyeong/thumbnail.webp");
  const thumbnail = await sharp(new URL(`../../../public${item.imageSrc}`, import.meta.url).pathname).metadata();
  assert.equal(thumbnail.width, 1536);
  assert.equal(thumbnail.height, 1121);
  assert.equal(item.spaceImageSrc, "/assets/works/lee-nagyeong/space.webp");
  assert.equal(detail.images.length, 11);
  assert.equal(detail.heroSrc, "/assets/works/lee-nagyeong/hero.webp");
  assert.equal(detail.title, "유일 油 日");
  assert.deepEqual(WORK_ITEMS.filter(work => work.spaceImageSrc.includes("placeholder")), []);
  assert.equal(detail.storyKo, WORK_INTRODUCTIONS["이나경"].storyKo);
  assert.equal(detail.email, PROFILE_SHEET_CONTENT["이나경"].email);
});

test("김서은 작품은 제출된 SPACE 표지와 대표·본문 5장을 기존 소개에 연결한다", () => {
  const item = WORK_ITEMS.find(work => work.id === 4);
  const detail = WORK_DETAILS["4"];
  const submitted = SUBMITTED_WORKS["김서은"];
  assert.ok(submitted, "김서은 제출 작품이 등록되어야 한다");
  assert.equal(item.imageSrc, "/assets/works/kim-seoeun/thumbnail.webp");
  assert.equal(item.spaceImageSrc, "/assets/works/kim-seoeun/space.webp");
  assert.ok(submitted.space.sourceFile.endsWith("졸전_웹상세-08.png"));
  assert.equal(submitted.space.originalWidth, 2600);
  assert.equal(submitted.space.originalHeight, 1592);
  assert.equal(detail.heroSrc, "/assets/works/kim-seoeun/hero.webp");
  assert.equal(detail.images.length, 5);
  assert.deepEqual(detail.images.map(image => image.sourceFile.split("/").at(-1)), ["김서은_001.png", "김서은_002.png", "김서은_003.png", "김서은_004.png", "김서은_005.png"]);
  assert.match(detail.storyKo, /^우리는 살아가며 다양한 관계를 맺고/);
  assert.equal(detail.storyKo.split("\n\n").length, 4);
  assert.equal(detail.email, "tjdms0214@daum.net");
  assert.equal(detail.instagram, "seo_eun_214");
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
      const previewBytes = Buffer.from(image.blurDataURL.split(",")[1], "base64");
      assert.ok(previewBytes.length <= 4096, `${work.artist} preview payload`);
      const preview = await sharp(previewBytes).metadata();
      assert.ok(preview.width <= 256 && preview.height <= 512);
      assert.ok(Math.max(preview.width, preview.height) >= 64, `${work.artist} recognizable preview`);
    }
  }
});
