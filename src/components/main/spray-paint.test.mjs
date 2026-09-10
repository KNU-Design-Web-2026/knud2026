import assert from "node:assert/strict";
import test from "node:test";
import { createPaintDrip, createPaintStamp, getDripProgress, getPaintOpacity } from "./spray-paint.ts";

function seededRandom() {
  let seed = 42;
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

test("미세 입자의 반지름은 1.15 CSS px 이하이고 생성 후 형태가 변하지 않는다", () => {
  const first = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#F8D622", seededRandom());
  const second = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#F8D622", seededRandom());
  assert.deepEqual(first, second);
  assert.ok(first.particles.every(({ radius, alpha }) => radius >= 0.25 && radius <= 1.15 && alpha > 0 && alpha <= 1));
  assert.equal(first.drip, null);
});

test("획 방향이 달라도 드립 시작점은 칠한 타원 안쪽의 아래에 붙는다", () => {
  for (const direction of [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const stamp = createPaintStamp({ x: 200, y: 150 }, 0, direction, "#FD9519", seededRandom());
    const drip = createPaintDrip(stamp, 240, seededRandom());
    const dx = drip.origin.x - stamp.x;
    const dy = drip.origin.y - stamp.y;
    const x = dx * Math.cos(direction) + dy * Math.sin(direction);
    const y = -dx * Math.sin(direction) + dy * Math.cos(direction);
    assert.ok(dy > 0);
    assert.ok((x / stamp.bodyWidth) ** 2 + (y / stamp.bodyHeight) ** 2 < 0.9 ** 2);
    assert.ok(drip.length <= 92 && drip.width <= 2.6);
  }
});

test("드립은 시간에 따라 증가하고 최종 길이를 넘지 않는다", () => {
  const stamp = createPaintStamp({ x: 0, y: 0 }, 0, 0, "#fff", seededRandom());
  const drip = createPaintDrip(stamp, 240, seededRandom());
  const timeline = [-100, 240, 400, 600, 900, 1500, 3000].map((at) => getDripProgress(drip, at));
  assert.equal(timeline[0], 0);
  assert.equal(timeline.at(-1), 1);
  assert.ok(timeline.every((value, index) => value >= (timeline[index - 1] ?? 0) && value <= 1));
});

test("칠과 드립은 2.8초 유지 후 함께 사라지고 3.6초에 투명해진다", () => {
  assert.equal(getPaintOpacity(0, 0), 1);
  assert.equal(getPaintOpacity(0, 2800), 1);
  assert.equal(getPaintOpacity(0, 3200), 0.5);
  assert.equal(getPaintOpacity(0, 3600), 0);
  assert.equal(getPaintOpacity(0, 5000), 0);
});

test("비산 입자는 개수를 늘리지 않고 진행 반대쪽으로 드문드문 분포한다", () => {
  const random = seededRandom();
  let backwards = 0, forwards = 0, bursts = 0;
  for (let index = 0; index < 100; index++) {
    const stamp = createPaintStamp({ x: 0, y: 0 }, 0, 0, "#fff", random);
    assert.equal(stamp.particles.length, 96);
    backwards += stamp.particles.filter(({ x }) => x < -stamp.bodyWidth * 1.3).length;
    forwards += stamp.particles.filter(({ x }) => x > stamp.bodyWidth * 1.3).length;
    if (stamp.particles.some(({ x }) => x < -stamp.bodyWidth * 1.92)) bursts++;
  }
  assert.ok(backwards > forwards * 1.5);
  assert.ok(bursts > 0 && bursts < 100, "튀는 점이 매 스탬프마다 반복되지 않아야 한다");
});

test("드래그 방향 반전 시 비산 방향도 반전되며 단순 클릭은 편향이 없다", () => {
  const right = createPaintStamp({ x: 0, y: 0 }, 0, 0, "#fff", seededRandom());
  const left = createPaintStamp({ x: 0, y: 0 }, 0, Math.PI, "#fff", seededRandom());
  right.particles.forEach((particle, index) => {
    assert.ok(Math.abs(particle.x + left.particles[index].x) < 1e-10);
    assert.ok(Math.abs(particle.y + left.particles[index].y) < 1e-10);
  });
  const click = createPaintStamp({ x: 0, y: 0 }, 0, null, "#fff", seededRandom());
  assert.ok(click.particles.every(({ x, y }) => Math.hypot(x / click.bodyWidth, y / click.bodyHeight) <= 1.92));
});
