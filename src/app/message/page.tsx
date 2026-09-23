import type { Metadata } from "next";
import { MessagePage } from "@/components/message/message-page";
import type { Letter } from "@/features/rolling-paper/model";
import { getPublicLetters } from "@/features/rolling-paper/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "축하 메시지",
  description: "경북대학교 디자인학과 졸업생에게 축하 메시지를 남겨보세요.",
};

export default async function MessageRoute() {
  let initialMessages: Letter[] = [];
  let initialError = "";

  try {
    initialMessages = await getPublicLetters();
  } catch (error) {
    console.error("Failed to render public letters", error);
    initialError = "메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return <MessagePage initialError={initialError} initialMessages={initialMessages} />;
}
