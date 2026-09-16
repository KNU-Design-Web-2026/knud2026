import { getMessageUsage, MESSAGE_MAX_LENGTH } from "../../lib/message-input";
import {
  LETTER_SENDER_MAX_LENGTH,
  RECIPIENT_OPTIONS,
  type CreateLetterInput,
  type Recipient,
} from "./model";

export class LetterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LetterValidationError";
  }
}

function readTrimmedString(value: unknown, fieldLabel: string) {
  if (typeof value !== "string") {
    throw new LetterValidationError(`${fieldLabel}을(를) 입력해주세요.`);
  }

  const trimmed = value.replace(/\r\n?/g, "\n").trim();
  if (!trimmed) {
    throw new LetterValidationError(`${fieldLabel}을(를) 입력해주세요.`);
  }

  return trimmed;
}

function isRecipient(value: string): value is Recipient {
  return (RECIPIENT_OPTIONS as readonly string[]).includes(value);
}

export function parseCreateLetterInput(value: unknown): CreateLetterInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LetterValidationError("메시지 형식을 확인해주세요.");
  }

  const input = value as Record<string, unknown>;
  const to = readTrimmedString(input.to, "받는 사람");
  const from = readTrimmedString(input.from, "보내는 사람");
  const body = readTrimmedString(input.body, "메시지");

  if (!isRecipient(to)) {
    throw new LetterValidationError("목록에서 받는 사람을 선택해주세요.");
  }
  if (Array.from(from).length > LETTER_SENDER_MAX_LENGTH) {
    throw new LetterValidationError(`보내는 사람은 ${LETTER_SENDER_MAX_LENGTH}자 이내로 입력해주세요.`);
  }
  if (getMessageUsage(body) > MESSAGE_MAX_LENGTH) {
    throw new LetterValidationError(`메시지는 화면 사용량 기준 ${MESSAGE_MAX_LENGTH}자 이내로 입력해주세요.`);
  }

  return { to, from, body };
}
