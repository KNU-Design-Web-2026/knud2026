import type { Metadata } from "next";
import { MessagePage } from "@/components/message/message-page";

export const metadata: Metadata = {
  title: "축하 메시지",
  description: "경북대학교 디자인학과 졸업생에게 축하 메시지를 남겨보세요.",
};

export default function MessageRoute() {
  return <MessagePage />;
}
