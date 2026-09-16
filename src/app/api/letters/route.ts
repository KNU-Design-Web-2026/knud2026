import { LetterRepositoryError } from "@/features/rolling-paper/repository";
import { createPublicLetter, getPublicLetters } from "@/features/rolling-paper/service";
import { LetterValidationError } from "@/features/rolling-paper/validation";

export const dynamic = "force-dynamic";

function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET() {
  try {
    const letters = await getPublicLetters();
    return Response.json({ letters }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to list public letters", error);
    return errorResponse("메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", 503);
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("메시지 형식을 확인해주세요.", 400);
  }

  try {
    const letter = await createPublicLetter(payload, getClientAddress(request));
    return Response.json({ letter }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof LetterValidationError) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof LetterRepositoryError && error.code === "rate_limited") {
      return errorResponse(error.message, 429);
    }

    console.error("Failed to create public letter", error);
    return errorResponse("메시지를 전하지 못했습니다. 잠시 후 다시 시도해주세요.", 503);
  }
}
