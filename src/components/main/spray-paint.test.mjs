import assert from "node:assert/strict";
import test from "node:test";
import * as paint from "./spray-paint.ts";
import { canStartPaintDrip, createPaintDrip, createPaintStamp, findScheduledDrip, getDripProgress, getPaintOpacity, GRAIN_COUNT, TEXTURE_RADIUS_X, TEXTURE_RADIUS_Y } from "./spray-paint.ts";

function seededRandom() {
  let seed = 42;
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

test("획 농도는 불규칙한 진하고 옅은 구간을 급격한 점프 없이 만든다", () => {
  assert.equal(typeof paint.createPaintDensity, "function");
  const next = paint.createPaintDensity(seededRandom());
  const values = Array.from({ length: 200 }, () => next());
  assert.ok(Math.min(...values) < 0.7 && Math.max(...values) > 0.95);
  assert.ok(values.every((v, i) => v >= 0.58 && v <= 1 && (i === 0 || Math.abs(v - values[i - 1]) < 0.11)));
  const replay = paint.createPaintDensity(seededRandom());
  assert.deepEqual(values, Array.from({ length: 200 }, () => replay()));
});

test("예약한 중간 획은 포인터 위치와 무관하게 지연 후 흐르고 한 번만 생성된다", () => {
  const stamp = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#fff", seededRandom());
  const tip = createPaintStamp({ x: 500, y: 100 }, 200, 0, "#fff", seededRandom());
  stamp.dripAt = 250;
  assert.equal(findScheduledDrip([stamp, tip], 249, -Infinity), undefined);
  assert.equal(findScheduledDrip([stamp, tip], 250, -Infinity), stamp);
  stamp.drip = createPaintDrip(stamp, 250, seededRandom());
  assert.equal(findScheduledDrip([stamp, tip], 700, 250), undefined);
});

test("예약 드립도 쿨다운과 위치 간격 및 젖은 도포 수명을 지킨다", () => {
  const active = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#fff", seededRandom());
  active.drip = createPaintDrip(active, 100, seededRandom());
  const candidate = createPaintStamp({ x: 200, y: 100 }, 200, 0, "#fff", seededRandom());
  candidate.dripAt = 380;
  const stamps = [active, candidate];
  assert.equal(findScheduledDrip(stamps, 519, 100), undefined);
  assert.equal(findScheduledDrip(stamps, 520, 100), candidate);
  candidate.x = 130;
  assert.equal(canStartPaintDrip(stamps, candidate, 600, 100), false);
  candidate.x = 200;
  assert.equal(findScheduledDrip(stamps, 1100, 100), undefined);
});

test("기존 드립과 예약 드립이 같은 8개 상한을 공유한다", () => {
  const active = Array.from({ length: 8 }, (_, index) => {
    const stamp = createPaintStamp({ x: index * 100, y: 100 }, 0, 0, "#fff", seededRandom());
    stamp.drip = createPaintDrip(stamp, 200, seededRandom());
    return stamp;
  });
  const candidate = createPaintStamp({ x: 900, y: 100 }, 6200, 0, "#fff", seededRandom());
  assert.equal(canStartPaintDrip([...active, candidate], candidate, 6599, 200), false);
  assert.equal(canStartPaintDrip([...active, candidate], candidate, 6600, 200), true);
});

test("미세 입자의 반지름은 1.15 CSS px 이하이고 생성 후 형태가 변하지 않는다", () => {
  const first = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#F8D622", seededRandom());
  const second = createPaintStamp({ x: 100, y: 100 }, 0, 0, "#F8D622", seededRandom());
  assert.deepEqual(first, second);
  assert.ok(first.particles.every(({ radius, alpha }) => radius >= 0.2 && radius * Math.max(first.bodyWidth / TEXTURE_RADIUS_X, first.bodyHeight / TEXTURE_RADIUS_Y) <= 1.15 && alpha > 0 && alpha <= 1));
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

test("칠과 드립은 5.4초 유지 후 함께 사라지고 6.6초에 투명해진다", () => {
  assert.equal(getPaintOpacity(0, 0), 1);
  assert.equal(getPaintOpacity(0, 5400), 1);
  assert.equal(getPaintOpacity(0, 6000), 0.5);
  assert.equal(getPaintOpacity(0, 6600), 0);
  assert.equal(getPaintOpacity(0, 7000), 0);
});

test("일부 텍스처의 외곽 입자는 진행 반대쪽으로 더 멀리 비산한다", () => {
  const random = seededRandom();
  let backwards = 0, forwards = 0, bursts = 0;
  for (let index = 0; index < 100; index++) {
    const stamp = createPaintStamp({ x: 0, y: 0 }, 0, 0, "#fff", random);
    assert.equal(stamp.particles.length, GRAIN_COUNT);
    backwards += stamp.particles.filter(({ x }) => x < -TEXTURE_RADIUS_X * 1.5).length;
    forwards += stamp.particles.filter(({ x }) => x > TEXTURE_RADIUS_X * 1.5).length;
    if (stamp.particles.some(({ x }) => x < -TEXTURE_RADIUS_X * 2.25)) bursts++;
  }
  assert.ok(backwards > forwards * 1.15);
  assert.ok(bursts > 0 && bursts < 100, "튀는 점이 매 스탬프마다 반복되지 않아야 한다");
});

test("드래그 방향 반전 시 비산 방향도 반전되며 단순 클릭은 편향이 없다", () => {
  const right = createPaintStamp({ x: 0, y: 0 }, 0, 0, "#fff", seededRandom());
  const left = createPaintStamp({ x: 0, y: 0 }, 0, Math.PI, "#fff", seededRandom());
  assert.equal(right.particles, left.particles, "같은 질감을 회전하여 재사용한다");
  assert.equal(left.direction - right.direction, Math.PI);
  const click = createPaintStamp({ x: 0, y: 0 }, 0, null, "#fff", seededRandom());
  assert.ok(click.particles.every(({ x, y }) => Math.hypot(x / TEXTURE_RADIUS_X, y / TEXTURE_RADIUS_Y) <= 2.25));
});

test("입자층은 중심이 조밀하고 외곽이 성기며 템플릿 수가 제한된다", () => {
  const templates = new Set();
  const random = seededRandom();
  for (let index = 0; index < 300; index++) {
    const stamp = createPaintStamp({ x: index, y: 0 }, index, 0, "#fff", random);
    templates.add(stamp.particles);
    const distances = stamp.particles.map(({ x, y }) => Math.hypot(x / TEXTURE_RADIUS_X, y / TEXTURE_RADIUS_Y));
    const center = distances.filter((r) => r < 0.5).length / 0.25;
    const middle = distances.filter((r) => r >= 0.5 && r < 1).length / 0.75;
    const outer = distances.filter((r) => r >= 1 && r < 2).length / 3;
    assert.ok(center > middle && middle > outer * 2);
  }
  assert.ok(templates.size <= 24);
});
