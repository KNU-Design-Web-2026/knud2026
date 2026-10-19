import assert from "node:assert/strict";
import test from "node:test";
import { getMessageUsage, normalizeMessageBody } from "./message-input";
import { parseCreateLetterInput } from "../features/rolling-paper/validation";

test("100자 한글 메시지는 잘리지 않고 입력 정규화와 서버 검증을 통과한다", () => {
  const body = "가".repeat(100);
  assert.equal(normalizeMessageBody(body), body);
  assert.equal(parseCreateLetterInput({ to: "김서은", from: "관람객", body }).body, body);
});

test("101번째 글자는 입력 시 제외하고 서버에 직접 보내도 거부한다", () => {
  assert.equal(normalizeMessageBody("가".repeat(101)), "가".repeat(100));
  assert.throws(() => parseCreateLetterInput({ to: "김서은", from: "관람객", body: "가".repeat(101) }), /100자 이내/);
});

test("줄바꿈의 20칸 가중치를 유지해 정확히 100칸은 허용하고 초과는 거부한다", () => {
  const multiline = "가".repeat(40) + "\n" + "나".repeat(40);
  assert.equal(getMessageUsage(multiline), 100);
  assert.equal(normalizeMessageBody(multiline), multiline);
  assert.equal(parseCreateLetterInput({ to: "김서은", from: "관람객", body: multiline }).body, multiline);
  assert.throws(() => parseCreateLetterInput({ to: "김서은", from: "관람객", body: multiline + "나" }), /100자 이내/);
});

test("기존 편지 본문은 한도를 늘려도 변경하지 않고 반환한다", () => {
  const body = "졸업 축하해요!\n앞으로도 응원할게요.";
  assert.equal(normalizeMessageBody(body), body);
});
