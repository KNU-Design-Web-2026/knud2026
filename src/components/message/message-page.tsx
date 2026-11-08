"use client";

import { useRef, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import type { Letter } from "@/features/rolling-paper/model";

import { MessageComposer } from "./message-composer";
import { MessageWall } from "./message-wall";

type MessagePageProps = {
  initialMessages: Letter[];
  initialError?: string;
  isInitialLoading?: boolean;
};

export function MessagePage({
  initialMessages,
  initialError = "",
  isInitialLoading = false,
}: MessagePageProps) {
  const pageRef = useRef<HTMLElement>(null);
  const [messageList, setMessageList] = useState<Letter[]>(() =>
    [...initialMessages].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ),
  );

  function handlePublished(letter: Letter) {
    setMessageList((current) => [letter, ...current.filter((message) => message.id !== letter.id)]);
  }

  return (
    <section className="message-page" data-clarity-mask="true" aria-labelledby="message-page-title" ref={pageRef}>
      <h1 className="sr-only" id="message-page-title">MESSAGE</h1>
      <MessageComposer isInitialLoading={isInitialLoading} onPublished={handlePublished}>
        <MessageWall
          initialError={initialError}
          isInitialLoading={isInitialLoading}
          messageList={messageList}
          pageRef={pageRef}
        />
        <SiteFooter />
      </MessageComposer>
    </section>
  );
}
