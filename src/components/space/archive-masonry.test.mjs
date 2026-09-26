import assert from "node:assert/strict";
import test from "node:test";

test("Masonry는 다음 사진을 현재 높이가 가장 짧은 열에 배치한다", async () => {
  let calculateMasonryLayout;

  try {
    ({ calculateMasonryLayout } = await import("./archive-masonry.ts"));
  } catch {
    assert.fail("Archive Masonry 레이아웃 계산기가 필요하다");
  }

  const layout = calculateMasonryLayout(
    [
      { width: 100, height: 100 },
      { width: 100, height: 200 },
      { width: 100, height: 50 },
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    ],
    { columnCount: 3, containerWidth: 320, gap: 10 },
  );

  assert.deepEqual(layout.items, [
    { height: 100, left: 0, top: 0, width: 100 },
    { height: 200, left: 110, top: 0, width: 100 },
    { height: 50, left: 220, top: 0, width: 100 },
    { height: 100, left: 220, top: 60, width: 100 },
    { height: 100, left: 0, top: 110, width: 100 },
  ]);
  assert.equal(layout.height, 210);
});
