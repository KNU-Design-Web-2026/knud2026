import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import * as spaceData from "./space-data.ts";

const { archiveColumns, spaceMapSize, spacePositions } = spaceData;

test("S3 Archive 테스트 데이터는 서로 다른 원본 이미지 40장을 제공한다", () => {
  const images = spaceData.s3ArchiveImages;

  assert.equal(images?.length, 40);
  assert.equal(new Set(images?.map(image => image.src)).size, 40);
  assert.equal(images?.[0]?.src, "https://design-graduation-image.s3.ap-northeast-2.amazonaws.com/archive/1.webp");
  assert.equal(images?.[39]?.src, "https://design-graduation-image.s3.ap-northeast-2.amazonaws.com/archive/40.webp");
  assert.ok(images?.every(image => image.width > 0 && image.height > 0));
});

test("지도 좌표는 원본 배치도 범위 안에 있다", () => {
  assert.equal(spacePositions.length, 20);
  for (const position of spacePositions) {
    assert.ok(position.x >= 0 && position.x < spaceMapSize.width);
    assert.ok(position.y >= 0 && position.y < spaceMapSize.height);
  }
});

test("아카이브는 Figma의 세 열과 열별 패널 비율을 유지한다", () => {
  assert.deepEqual(archiveColumns.map(column => column.length), [3, 5, 4]);
  for (const height of archiveColumns.flat()) assert.ok(height > 0);
});

test("실제 Space Archive는 S3 원본 40장을 6장씩 점진적으로 요청한다", async () => {
  const page = await readFile(new URL("./space-page.tsx", import.meta.url), "utf8");
  const gallery = await readFile(new URL("./archive-gallery.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("./space-page.module.css", import.meta.url), "utf8");

  assert.match(page, /<ArchiveGallery images=\{s3ArchiveImages\}/);
  assert.match(gallery, /const batchSize = 6/);
  assert.match(gallery, /loading="eager"/);
  assert.match(gallery, /decoding="async"/);
  assert.match(gallery, /type="image\/avif"/);
  assert.match(gallery, /type="image\/webp"/);
  assert.match(gallery, /\(max-width: 821px\) 46vw/);
  assert.match(gallery, /backgroundImage: isVisible && image\.blurDataURL \? `url\(\$\{image\.blurDataURL\}\)` : undefined/);
  assert.match(gallery, /rootMargin: "600px 0px"/);
  assert.match(gallery, /rootMargin: "800px 0px"/);
  assert.match(gallery, /Math\.min\(current \+ batchSize, images\.length\)/);
  assert.match(gallery, /전시 아카이브 성능 테스트 이미지/);
  assert.match(css, /\.archivePhotoGrid \{ --archive-column-count: 3; display: grid; grid-auto-flow: row; align-items: start; \}/);
  assert.match(css, /\.archivePhotoGrid\[data-masonry-ready="true"\] \{ position: relative; display: block; \}/);
  assert.match(css, /\.archivePhotoPicture \{[^}]*animation: archive-photo-in 280ms ease-out both;/);
  assert.match(css, /@media \(max-width: 821px\) \{[\s\S]*?\.archivePhotoGrid \{ --archive-column-count: 2; grid-template-columns: 515fr 514fr; \}/);
});

test("Space 지도는 원본 자산과 접근 가능한 미리보기 제어를 사용한다", async () => {
  const map = await readFile(new URL("./space-map.tsx", import.meta.url), "utf8");
  for (const asset of ["map-outline.svg", "map-island.svg", "map-entry.svg"]) {
    assert.ok(map.includes(asset));
    const bytes = await readFile(new URL(`../../../public/assets/figma/space/${asset}`, import.meta.url));
    assert.ok(bytes.length > 0);
  }
  assert.match(map, /aria-expanded=\{active === index\}/);
  assert.match(map, /onFocus=/);
  assert.match(map, /onClick=/);
  assert.match(map, /href=\{`\/work\/\$\{assigned\.id\}`\}/);
  assert.match(map, /desktopPreviewQuery = "\(min-width: 1350\.0625px\)"/);
  assert.match(map, /event\.preventDefault\(\)/);
  assert.match(map, /event.key === "Escape"/);
  assert.match(map, /onPointerLeave=\{\(\) => setActive\(null\)\}/);
  assert.match(map, /src=\{work.imageSrc\}/);
  assert.match(map, /aria-hidden=\{active === null\}/);
  assert.match(map, /map-island\.svg[^>]*fetchPriority="high"/);
});

test("1020px 태블릿은 클릭 안내를 표시하고 이름 링크로 상세 페이지를 연다", async () => {
  const page = await readFile(new URL("./space-page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("./space-page.module.css", import.meta.url), "utf8");

  assert.match(page, /className=\{styles\.tabletInstruction\}>이름을 클릭하여 작품 정보를 확인해보세요!/);
  assert.match(
    css,
    /@media \(max-width: 1350px\) \{[\s\S]*?\.desktopInstruction \{ display: none; \}[\s\S]*?\.tabletInstruction \{ display: inline; \}/,
  );
  assert.match(
    css,
    /@media \(max-width: 821px\) \{[\s\S]*?\.tabletInstruction \{ display: none; \}[\s\S]*?\.compactInstruction \{ display: inline; \}/,
  );
});

test("작은 화면은 별도의 지도 방향과 두 열 아카이브를 사용한다", async () => {
  const css = await readFile(new URL("./space-page.module.css", import.meta.url), "utf8");
  const compact = await readFile(new URL("./compact-space-map.tsx", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: 515fr 514fr;/);
  assert.match(css, /aspect-ratio: 298 \/ 529\.1523/);
  assert.match(css, /\.archiveColumn:last-child \{ display: none; \}/);
  assert.match(compact, /const tabletNames =/);
  assert.match(compact, /const mobileNames =/);
  assert.match(compact, /href=\{`\/work\/\$\{work.id\}`\}/);
  assert.equal(compact.match(/priority/g)?.length, 3);
  assert.match(compact, /map-island\.svg[^>]*fetchPriority="high"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /opacity 240ms/);
});

test("Space 콘텐츠 상하 여백은 모든 화면에서 Profile 기준에 시각 보정값을 더한다", async () => {
  const css = await readFile(new URL("./space-page.module.css", import.meta.url), "utf8");

  assert.match(css, /\.content \{[\s\S]*?padding-block: var\(--content-page-edge-gap\)/);
  assert.equal(css.match(/padding-block:/g)?.length, 1);
});

test("Space 아카이브 소개 문구는 IGNITE 표기와 올바른 띄어쓰기를 사용한다", async () => {
  const page = await readFile(new URL("./space-page.tsx", import.meta.url), "utf8");

  assert.match(page, /IGNITE의 모든 순간을 담은 아카이브입니다\./);
  assert.doesNotMatch(page, /Ignite/);
  assert.doesNotMatch(page, /아카이브 입니다\./);
});
