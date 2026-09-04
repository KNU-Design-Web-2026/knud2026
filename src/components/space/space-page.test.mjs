import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { archiveColumns, spaceMapSize, spacePositions } from "./space-data.ts";

test("지도 이름은 원본 배치도 범위 안에 있으며 임의의 작가를 배정하지 않는다", () => {
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
  for (const asset of ["map-outline.svg", "map-island.svg", "map-entry.svg", "project-preview.png"]) {
    assert.ok(map.includes(asset));
    const bytes = await readFile(new URL(`../../../public/assets/figma/space/${asset}`, import.meta.url));
    assert.ok(bytes.length > 0);
  }
  assert.match(map, /aria-expanded=\{open\}/);
  assert.match(map, /onFocus=/);
  assert.match(map, /onClick=/);
  assert.match(map, /event.key === "Escape"/);
  assert.match(map, /removeEventListener\("pointerdown", dismiss\)/);
});
