import { useEffect, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { PageContainer } from "@/components/layout/page-container";
import type { Letter } from "@/features/rolling-paper/model";

const INITIAL_REVEAL_STEP_MS = 70;
const INITIAL_REVEAL_MAX_INDEX = 7;
const INITIAL_REVEAL_CLEANUP_MS = 1_300;

function MessageCard({
  index,
  isInitialRevealActive,
  message,
}: {
  index: number;
  isInitialRevealActive: boolean;
  message: Letter;
}) {
  const initialRevealStyle = isInitialRevealActive
    ? ({
        "--message-initial-reveal-delay": `${Math.min(index, INITIAL_REVEAL_MAX_INDEX) * INITIAL_REVEAL_STEP_MS}ms`,
      } as CSSProperties)
    : undefined;

  return (
    <article
      className="message-card"
      data-message-reveal
      data-message-visible="false"
      data-node-id="1742:88482"
      style={initialRevealStyle}
    >
      <div className={`message-card__surface${isInitialRevealActive ? " message-card--initial-reveal" : ""}`}>
        <div className="message-card__content">
          <div className="message-card__copy">
            <p className="message-card__to">
              To. <strong className="message-card__recipient-name">{message.to}</strong>
            </p>
            <p className="message-card__body">{message.body}</p>
          </div>
          <p className="message-card__from">From. {message.from}</p>
        </div>
      </div>
    </article>
  );
}

const MESSAGE_SKELETON_COUNT = 8;

function MessageListSkeleton() {
  return Array.from({ length: MESSAGE_SKELETON_COUNT }, (_, index) => (
    <article aria-hidden="true" className="message-card message-card--skeleton" key={index}>
      <div className="message-card__skeleton-line message-card__skeleton-line--to" />
      <div className="message-card__skeleton-copy">
        <div className="message-card__skeleton-line" />
        <div className="message-card__skeleton-line" />
        <div className="message-card__skeleton-line message-card__skeleton-line--short" />
      </div>
      <div className="message-card__skeleton-line message-card__skeleton-line--from" />
    </article>
  ));
}

type MessageWallProps = {
  initialError: string;
  isInitialLoading: boolean;
  messageList: Letter[];
  pageRef: RefObject<HTMLElement | null>;
};

export function MessageWall({ initialError, isInitialLoading, messageList, pageRef }: MessageWallProps) {
  const [listError] = useState(initialError);
  const [isInitialRevealActive, setIsInitialRevealActive] = useState(
    () => messageList.length > 0,
  );

  useEffect(() => {
    if (!isInitialRevealActive) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsInitialRevealActive(false);
    }, INITIAL_REVEAL_CLEANUP_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isInitialRevealActive]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const revealTargets = page.querySelectorAll<HTMLElement>("[data-message-reveal]");
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => {
        target.dataset.messageVisible = "true";
      });
      return;
    }

    page.dataset.messageMotionReady = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.setAttribute("data-message-visible", String(entry.isIntersecting));
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    // Observe fixed shells, never the translated paper inside them.
    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      delete page.dataset.messageMotionReady;
    };
  }, [messageList.length, pageRef]);

  return (
    <PageContainer className="message-list-container">
      <div className="message-list-status" aria-live="polite">
        {!isInitialLoading && listError && listError}
        {!isInitialLoading && !listError && messageList.length === 0 && "아직 도착한 메시지가 없습니다. 첫 마음을 남겨주세요."}
      </div>
      <div className="message-list" aria-busy={isInitialLoading} aria-label="방명록 메시지 목록">
        {isInitialLoading
          ? <MessageListSkeleton />
          : messageList.map((message, index) => (
            <MessageCard
              index={index}
              isInitialRevealActive={isInitialRevealActive}
              key={message.id}
              message={message}
            />
          ))}
      </div>
    </PageContainer>
  );
}
