import { LETTER_LIST_LIMIT, type CreateLetterInput, type Letter } from "./model";

type SupabaseLetterRow = {
  id: number | string;
  recipient: string;
  sender: string;
  body: string;
  created_at: string;
};

export class LetterRepositoryError extends Error {
  constructor(
    message: string,
    readonly code: "configuration" | "rate_limited" | "request_failed",
  ) {
    super(message);
    this.name = "LetterRepositoryError";
  }
}

function readRepositoryConfig() {
  const url = process.env.KNUD_MESSAGES_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.KNUD_MESSAGES_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new LetterRepositoryError("메시지 저장소가 아직 연결되지 않았습니다.", "configuration");
  }

  return { url, serviceRoleKey };
}

function requestHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function toLetter(row: SupabaseLetterRow): Letter {
  return {
    id: String(row.id),
    to: row.recipient as Letter["to"],
    from: row.sender,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? "";
  } catch {
    return "";
  }
}

export async function listPublicLetters(fetchImplementation: typeof fetch = fetch) {
  const { url, serviceRoleKey } = readRepositoryConfig();
  const query = new URLSearchParams({
    select: "id,recipient,sender,body,created_at",
    hidden_at: "is.null",
    order: "created_at.asc",
    limit: String(LETTER_LIST_LIMIT),
  });
  const response = await fetchImplementation(`${url}/rest/v1/public_letters?${query}`, {
    headers: requestHeaders(serviceRoleKey),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new LetterRepositoryError("메시지를 불러오지 못했습니다.", "request_failed");
  }

  const rows = (await response.json()) as SupabaseLetterRow[];
  return rows.map(toLetter);
}

export async function insertPublicLetter(
  input: CreateLetterInput,
  clientHash: string,
  fetchImplementation: typeof fetch = fetch,
) {
  const { url, serviceRoleKey } = readRepositoryConfig();
  const response = await fetchImplementation(`${url}/rest/v1/rpc/create_public_letter`, {
    method: "POST",
    headers: requestHeaders(serviceRoleKey),
    body: JSON.stringify({
      p_recipient: input.to,
      p_sender: input.from,
      p_body: input.body,
      p_client_hash: clientHash,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    if (message.includes("LETTER_RATE_LIMITED")) {
      throw new LetterRepositoryError("잠시 후 다시 메시지를 남겨주세요.", "rate_limited");
    }
    throw new LetterRepositoryError("메시지를 저장하지 못했습니다.", "request_failed");
  }

  const rows = (await response.json()) as SupabaseLetterRow[];
  if (!rows[0]) {
    throw new LetterRepositoryError("저장된 메시지를 확인하지 못했습니다.", "request_failed");
  }

  return toLetter(rows[0]);
}
