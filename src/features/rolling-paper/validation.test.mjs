import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const validationPath = fileURLToPath(new URL("./validation.ts", import.meta.url));
const { LetterValidationError, parseCreateLetterInput } = await import(validationPath);

assert.deepEqual(
  parseCreateLetterInput({ to: "김가연", from: " 관람객 ", body: " 축하해요! " }),
  { to: "김가연", from: "관람객", body: "축하해요!" },
);

assert.throws(
  () => parseCreateLetterInput({ to: "존재하지 않는 사람", from: "관람객", body: "축하해요" }),
  LetterValidationError,
);
assert.throws(
  () => parseCreateLetterInput({ to: "김가연", from: "가".repeat(21), body: "축하해요" }),
  /20자 이내/,
);
assert.throws(
  () => parseCreateLetterInput({ to: "김가연", from: "관람객", body: "가".repeat(151) }),
  /150자 이내/,
);
assert.equal(
  parseCreateLetterInput({ to: "김가연", from: "관람객", body: "가".repeat(150) }).body.length,
  150,
);
assert.throws(
  () => parseCreateLetterInput({ to: "김가연", from: "관람객", body: "가\n".repeat(9) }),
  /150자 이내/,
);

console.log("rolling-paper validation checks passed");
