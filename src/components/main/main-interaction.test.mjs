import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteCursorPath = new URL("../layout/site-cursor.tsx", import.meta.url);
const sprayCanvasPath = new URL("./spray-canvas.tsx", import.meta.url);

test("일반 사이트 커서는 34px × 40.33px 규격을 사용한다", () => {
  const cursor = readFileSync(siteCursorPath, "utf8");

  assert.match(cursor, /h-\[40\.33px\] w-\[34px\]/);
  assert.match(cursor, /sizes="34px"/);
});

test("메인 스프레이는 불규칙한 외곽선과 각진 잉크 드립을 그린다", () => {
  const spray = readFileSync(sprayCanvasPath, "utf8");

  assert.match(spray, /edgePoints: SprayEdgePoint\[\]/);
  assert.match(spray, /edgeJitter/);
  assert.match(spray, /context\.lineTo\(edgePoint\.x, edgePoint\.y\)/);
  assert.doesNotMatch(spray, /context\.ellipse\(0, 0, stamp\.bodyWidth/);
  assert.match(spray, /tipRadius/);
  assert.match(spray, /context\.lineJoin = "miter"/);
});
