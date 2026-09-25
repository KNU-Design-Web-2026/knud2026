"use client";

import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  DEFAULT_RECIPIENT,
  LETTER_SENDER_MAX_LENGTH,
  RECIPIENT_OPTIONS,
  type Letter,
  type Recipient,
} from "@/features/rolling-paper/model";
import {
  getMessageUsage,
  MESSAGE_MAX_LENGTH,
  normalizeMessageBody,
} from "@/lib/message-input";

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
      className={`message-card${isInitialRevealActive ? " message-card--initial-reveal" : ""}`}
      data-message-reveal
      data-message-visible="false"
      data-node-id="1742:88482"
      style={initialRevealStyle}
    >
      <div className="message-card__content">
        <div className="message-card__copy">
          <p className="message-card__to">
            To. <strong className="message-card__recipient-name">{message.to}</strong>
          </p>
          <p className="message-card__body">{message.body}</p>
        </div>
        <p className="message-card__from">From. {message.from}</p>
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
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    ),
  );
  const [to, setTo] = useState<Recipient>(DEFAULT_RECIPIENT);
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError] = useState(initialError);
  const [formError, setFormError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isInitialRevealActive, setIsInitialRevealActive] = useState(
    () => initialMessages.length > 0,
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
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isSubmitting) {
          setIsConfirmOpen(false);
        }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSubmitting]);

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

    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      delete page.dataset.messageMotionReady;
    };
  }, [messageList.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingFields = [
      !to.trim() && "받는 사람",
      !from.trim() && "보내는 사람",
      !body.trim() && "메시지",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setFormError(`${missingFields.join(", ")}을(를) 입력해주세요.`);
      return;
    }

    setFormError("");
    setSubmissionError("");
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, from: from.trim(), body: body.trim() }),
      });
      const payload = (await response.json()) as { letter?: Letter; error?: string };
      if (!response.ok || !payload.letter) {
        throw new Error(payload.error || "메시지를 전하지 못했습니다.");
      }

      setMessageList((current) => [
        ...current.filter((message) => message.id !== payload.letter!.id),
        payload.letter!,
      ]);
      setTo(DEFAULT_RECIPIENT);
      setFrom("");
      setBody("");
      setIsConfirmOpen(false);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "메시지를 전하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="message-page" aria-labelledby="message-page-title" ref={pageRef}>
      <h1 className="sr-only" id="message-page-title">GUESTBOOK</h1>
      <div className="message-page__intro">
        <picture className="message-page__decor">
          <source media="(max-width: 400px)" srcSet="/assets/figma/message/message-decor-mobile.png" />
          <source media="(max-width: 600px)" srcSet="/assets/figma/message/message-decor-tab-mobile.png" />
          <source media="(max-width: 1020px)" srcSet="/assets/figma/message/message-decor-tab.png" />
          <source media="(max-width: 1350px)" srcSet="/assets/figma/message/message-decor-web-tab.png" />
          <img alt="" src="/assets/figma/message/message-decor-web.png" />
        </picture>
        <picture className="message-page__frame message-page__frame--outer">
          <source media="(max-width: 1020px)" srcSet="/assets/figma/message/message-frame-tab-outer.svg" />
          <source media="(max-width: 1350px)" srcSet="/assets/figma/message/message-frame-web-tab-outer.svg" />
          <img alt="" src="/assets/figma/message/message-frame-outer.svg" />
        </picture>
        <picture className="message-page__frame message-page__frame--inner">
          <source media="(max-width: 1020px)" srcSet="/assets/figma/message/message-frame-tab-inner.svg" />
          <source media="(max-width: 1350px)" srcSet="/assets/figma/message/message-frame-web-tab-inner.svg" />
          <img alt="" src="/assets/figma/message/message-frame-inner.svg" />
        </picture>
        <picture className="message-page__frame message-page__frame--compact">
          <source media="(max-width: 400px)" srcSet="/assets/figma/message/message-frame-mobile.svg" />
          <img alt="" src="/assets/figma/message/message-frame-tab-mobile.svg" />
        </picture>
        <form className="message-form" inert={isInitialLoading} onSubmit={handleSubmit}>
          <div className="message-form__fields">
            <div className={`message-form__field message-form__field--to${isRecipientOpen ? " is-open" : ""}`}>
              <span>To.</span>
              <button
                aria-expanded={isRecipientOpen}
                aria-haspopup="listbox"
                aria-label="받는 사람"
                className={`message-form__recipient-trigger${to !== DEFAULT_RECIPIENT ? " is-selected" : ""}`}
                onClick={() => setIsRecipientOpen((isOpen) => !isOpen)}
                type="button"
              >
                <span className="message-form__recipient-name">{to}</span>
                <picture className={`message-form__recipient-arrow${isRecipientOpen ? " is-open" : ""}`}>
                  <source media="(max-width: 400px)" srcSet="/assets/figma/message/message-select-arrow-mobile.svg" />
                  <img alt="" src="/assets/figma/message/message-select-arrow-tab-mobile.svg" />
                </picture>
              </button>
              {isRecipientOpen && (
                <ul aria-label="받는 사람 선택" className="message-form__recipient-menu" role="listbox">
                  {RECIPIENT_OPTIONS.map((recipient) => (
                    <li key={recipient} aria-selected={to === recipient} role="option">
                      <button
                        type="button"
                        onClick={() => {
                          setTo(recipient);
                          setIsRecipientOpen(false);
                          setFormError("");
                        }}
                      >
                        {recipient}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="message-form__field message-form__field--from">
              <span>From.</span>
              <input aria-label="보내는 사람" aria-describedby={formError ? "message-form-error" : undefined} maxLength={LETTER_SENDER_MAX_LENGTH} placeholder="보낸이" value={from} onChange={(event) => {
                setFrom(event.target.value);
                setFormError("");
              }} />
            </label>
          </div>
          <div className="message-form__body">
            <span className="sr-only">메시지</span>
            <textarea aria-label="메시지" aria-describedby={formError ? "message-form-error message-length-limit message-character-count" : "message-length-limit message-character-count"} maxLength={MESSAGE_MAX_LENGTH} placeholder={"전시를 보며 떠오른 생각, 느낀 감정, 전하고 싶은 한마디로 이곳에 불을 붙여 주세요.\n여러분의 한마디가 42회 졸업전시를 더 뜨겁게 완성합니다"} value={body} onChange={(event) => {
              setBody(normalizeMessageBody(event.target.value));
              setFormError("");
            }} />
            <p className="sr-only" id="message-length-limit">메시지는 화면 사용량 기준 최대 {MESSAGE_MAX_LENGTH}자까지 입력할 수 있습니다.</p>
            <output aria-live="polite" className="message-form__counter" id="message-character-count">
              {getMessageUsage(body)} / {MESSAGE_MAX_LENGTH}
            </output>
            <button type="submit">IGNITE</button>
            {formError && <p className="message-form__validation" id="message-form-error" role="alert">{formError}</p>}
          </div>
        </form>
      </div>
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
      <SiteFooter />
      {isConfirmOpen && (
        <div aria-modal="true" className="message-confirm-modal" role="dialog" aria-labelledby="message-confirm-title">
          <div className="message-confirm-modal__panel">
            <div className="message-confirm-modal__copy">
              <h2 id="message-confirm-title">따뜻한 마음, 이대로 전할까요?</h2>
              <p>받는 사람을 다시 한 번 확인해주세요.</p>
              {submissionError && <p className="message-confirm-modal__error" role="alert">{submissionError}</p>}
            </div>
            <div className="message-confirm-modal__actions">
              <button className="message-confirm-modal__edit" disabled={isSubmitting} type="button" onClick={() => setIsConfirmOpen(false)}>수정하기</button>
              <button className="message-confirm-modal__submit" disabled={isSubmitting} type="button" onClick={handleConfirm}>{isSubmitting ? "전하는 중" : "메시지 전하기"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
