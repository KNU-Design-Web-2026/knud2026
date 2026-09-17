import { createHash } from "node:crypto";
import { insertPublicLetter, listPublicLetters } from "./repository";
import { parseCreateLetterInput } from "./validation";

export async function getPublicLetters() {
  return listPublicLetters();
}

export async function createPublicLetter(value: unknown, clientAddress: string) {
  const input = parseCreateLetterInput(value);
  const rateLimitSecret = process.env.KNUD_MESSAGES_RATE_LIMIT_SECRET;

  if (!rateLimitSecret) {
    throw new Error("KNUD_MESSAGES_RATE_LIMIT_SECRET is not configured");
  }

  const clientHash = createHash("sha256")
    .update(`${rateLimitSecret}:${clientAddress}`)
    .digest("hex");

  return insertPublicLetter(input, clientHash);
}
