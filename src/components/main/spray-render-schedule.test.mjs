import assert from "node:assert/strict";
import test from "node:test";

import { getSprayRenderPlan } from "./spray-render-schedule.ts";

const stamp = (createdAt = 0) => ({ createdAt, dripAt: null, drip: null });
const timing = { dripEligibilityTime: 900, paintHold: 5_400, paintLifetime: 6_600 };

test("불투명한 정적 자국은 매 프레임을 그리지 않고 페이드 시작까지 기다린다", () => {
  assert.deepEqual(getSprayRenderPlan([stamp()], 1_000, timing), { animate: false, wakeAt: 5_400 });
  assert.deepEqual(getSprayRenderPlan([stamp()], 5_400, timing), { animate: true, wakeAt: null });
  assert.deepEqual(getSprayRenderPlan([stamp()], 6_599, timing), { animate: true, wakeAt: null });
  assert.deepEqual(getSprayRenderPlan([stamp()], 6_600, timing), { animate: false, wakeAt: null });
});

test("진행 중인 드립은 연속 프레임을 유지하고 완료 후에는 페이드 시각만 예약한다", () => {
  const input = stamp();
  input.drip = { startedAt: 500, duration: 900 };
  assert.deepEqual(getSprayRenderPlan([input], 1_399, timing), { animate: true, wakeAt: null });
  assert.deepEqual(getSprayRenderPlan([input], 1_400, timing), { animate: false, wakeAt: 5_400 });
});

test("미래의 예약 드립과 외부 상태 전환 중 가장 이른 시각에 다시 깨어난다", () => {
  const input = stamp();
  input.dripAt = 420;
  assert.deepEqual(getSprayRenderPlan([input], 100, timing, [340, 800]), { animate: false, wakeAt: 340 });
  assert.deepEqual(getSprayRenderPlan([input], 350, timing, [800]), { animate: false, wakeAt: 420 });
});

test("이미 지난 예약 드립은 즉시 재귀 예약하지 않고 다음 실제 변화까지 기다린다", () => {
  const input = stamp();
  input.dripAt = 200;
  assert.deepEqual(getSprayRenderPlan([input], 300, timing), { animate: false, wakeAt: 5_400 });
});

test("빈 화면과 드립 가능 시간을 지난 자국은 불필요한 작업을 예약하지 않는다", () => {
  assert.deepEqual(getSprayRenderPlan([], 1_000, timing), { animate: false, wakeAt: null });
  const input = stamp();
  input.dripAt = 2_000;
  assert.deepEqual(getSprayRenderPlan([input], 1_000, timing), { animate: false, wakeAt: 5_400 });
});
