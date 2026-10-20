import assert from "node:assert/strict";
import test from "node:test";
import { WORK_DETAILS } from "./work-details";

test("공동작품은 두 작가의 이메일을 각각 제공한다", () => {
  assert.deepEqual(WORK_DETAILS["9"].emails, [
    { artistKo: "박규리", email: "pkrpkr1004@naver.com" },
    { artistKo: "이다혜", email: "leeee.dahye@gmail.com" },
  ]);
});

test("개인작품은 해당 작가의 이메일만 제공한다", () => {
  assert.deepEqual(WORK_DETAILS["1"].emails, [
    { artistKo: "공예원", email: "gyewon05091@gmail.com" },
  ]);
});
