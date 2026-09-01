import assert from "node:assert/strict";
import test from "node:test";
import {
  QA_ROUTE_STATE_EVENT,
  isQaRouteReadyMessage,
  isQaRouteScrollCommand,
  isQaRouteSubscribeMessage,
} from "./qa-route-bridge.ts";

test("허용된 QA Hub의 경로 구독 메시지만 인식한다", () => {
  assert.equal(
    isQaRouteSubscribeMessage({ type: "knud.qa/subscribe-route", version: 1 }),
    true,
  );
  assert.equal(isQaRouteSubscribeMessage({ type: QA_ROUTE_STATE_EVENT }), false);
  assert.equal(isQaRouteSubscribeMessage(null), false);
});

test("QA Hub가 보낸 저장 위치 이동 요청만 인식한다", () => {
  assert.equal(
    isQaRouteScrollCommand({
      type: "knud.qa/scroll-to",
      version: 1,
      scrollX: 0,
      scrollY: 1280,
    }),
    true,
  );
  assert.equal(
    isQaRouteScrollCommand({
      type: "knud.qa/scroll-to",
      version: 1,
      scrollX: -1,
      scrollY: 1280,
    }),
    false,
  );
});

test("QA Hub가 다시 구독할 수 있도록 준비 메시지를 구분한다", () => {
  assert.equal(
    isQaRouteReadyMessage({ type: "knud.qa/route-ready", version: 1 }),
    true,
  );
  assert.equal(
    isQaRouteReadyMessage({ type: "knud.qa/route-ready", version: 2 }),
    false,
  );
});
