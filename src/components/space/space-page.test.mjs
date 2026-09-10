import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { archiveColumns, spaceMapSize, spacePositions } from "./space-data.ts";

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
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /opacity 240ms/);
});
