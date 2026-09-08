import assert from "node:assert/strict";
import test from "node:test";

import {
  compactActiveStamps,
  createSprayStamp,
  type SprayStamp,
} from "./spray-model.ts";

function assertClose(actual: number, expected: number) {
  assert.ok(
    Math.abs(actual - expected) < Number.EPSILON * 100,
    `expected ${actual} to be close to ${expected}`,
  );
}

test("같은 난수 입력은 기존 수식과 동일한 스프레이 스탬프를 만든다", () => {
  const stamp = createSprayStamp(
    { x: 120, y: 240 },
    1_000,
    0,
    "#F8D622",
    () => 0.5,
  );

  assert.equal(stamp.x, 120);
  assert.equal(stamp.y, 240);
  assert.equal(stamp.createdAt, 1_000);
  assert.equal(stamp.color, "#F8D622");
  assertClose(stamp.bodyWidth, 77.9);
  assertClose(stamp.bodyHeight, 18.05);
  assert.equal(stamp.edgePoints.length, 20);
  assert.equal(stamp.particles.length, 82);
  assert.equal(stamp.drip, null);

  assert.equal(stamp.particles[0].x, 0);
  assert.equal(stamp.particles[0].y, 0);
  assertClose(stamp.particles[0].radius, 3.99);
  assertClose(stamp.particles[0].alpha, 0.57);
  assert.equal(stamp.particles[81].x, 0);
  assert.equal(stamp.particles[81].y, 0);
  assertClose(stamp.particles[81].radius, 1.9475);
  assertClose(stamp.particles[81].alpha, 0.23);
});

test("방향을 적용해도 입자 밀도와 개수는 유지된다", () => {
  const stamp = createSprayStamp(
    { x: 0, y: 0 },
    0,
    Math.PI / 2,
    "#41C9F9",
    () => 0.75,
  );

  assert.equal(stamp.particles.length, 82);
  assert.equal(stamp.edgePoints.length, 20);
  assert.equal(stamp.color, "#41C9F9");
});

test("만료 스탬프를 새 배열 없이 제거하고 생존 순서를 유지한다", () => {
  const makeStamp = (createdAt: number) => ({
    createdAt,
  }) as SprayStamp;
  const stamps = [
    makeStamp(7_000),
    makeStamp(8_500),
    makeStamp(6_000),
    makeStamp(9_999),
  ];
  const original = stamps;

  const activeCount = compactActiveStamps(stamps, 10_000, 2_400);

  assert.equal(stamps, original);
  assert.equal(activeCount, 2);
  assert.deepEqual(stamps.map((stamp) => stamp.createdAt), [8_500, 9_999]);
});
