import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

process.env.KNUD_MESSAGES_SUPABASE_URL = "https://messages.example.test";
process.env.KNUD_MESSAGES_SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";

const repositoryPath = fileURLToPath(new URL("./repository.ts", import.meta.url));
const { insertPublicLetter, listPublicLetters } = await import(repositoryPath);

let listRequest;
const letters = await listPublicLetters(async (url, init) => {
  listRequest = { url: String(url), init };
  return Response.json([
    { id: 7, recipient: "김가연", sender: "관람객", body: "축하해요", created_at: "2026-09-15T12:00:00Z" },
  ]);
});

assert.match(listRequest.url, /public_letters/);
assert.match(listRequest.url, /hidden_at=is.null/);
assert.match(listRequest.url, /order=created_at.asc/);
assert.equal(listRequest.init.headers.apikey, "server-only-test-key");
assert.deepEqual(letters[0], {
  id: "7",
  to: "김가연",
  from: "관람객",
  body: "축하해요",
  createdAt: "2026-09-15T12:00:00Z",
});

let createRequest;
const created = await insertPublicLetter(
  { to: "김가연", from: "관람객", body: "졸업 축하해요" },
  "hashed-client",
  async (url, init) => {
    createRequest = { url: String(url), init };
    return Response.json([
      { id: 8, recipient: "김가연", sender: "관람객", body: "졸업 축하해요", created_at: "2026-09-15T12:01:00Z" },
    ]);
  },
);

assert.match(createRequest.url, /rpc\/create_public_letter/);
assert.deepEqual(JSON.parse(createRequest.init.body), {
  p_recipient: "김가연",
  p_sender: "관람객",
  p_body: "졸업 축하해요",
  p_client_hash: "hashed-client",
});
assert.equal(created.id, "8");

await assert.rejects(
  () => insertPublicLetter(
    { to: "김가연", from: "관람객", body: "다시 시도" },
    "hashed-client",
    async () => Response.json({ message: "LETTER_RATE_LIMITED" }, { status: 400 }),
  ),
  (error) => error.code === "rate_limited",
);

console.log("rolling-paper repository checks passed");
