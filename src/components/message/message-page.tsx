"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { messages as initialMessages, type Message } from "@/data/messages";

function MessageCard({ message }: { message: Message }) {
  return (
    <article className="message-card" data-node-id="1742:88482">
      <div className="message-card__content">
        <div className="message-card__copy">
          <p className="message-card__to">To. {message.to}</p>
          <div className="message-card__body">
            {message.body.split("\n").map((line) => <p key={line}>{line}</p>)}
          </div>
        </div>
        <p className="message-card__from">From. {message.from}</p>
      </div>
    </article>
  );
}

const recipientOptions = [
  "전체(모두)", "공예원", "김가연", "김민주", "김서은", "김세직", "김연수",
  "김은별", "김지언", "박규리", "박수정", "양혜연", "윤이지", "이나경",
  "이다혜", "이서윤", "이초원", "이하늘", "임경민", "조장원", "현연이",
];

export function MessagePage() {
  const [messageList, setMessageList] = useState(initialMessages);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const recipientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!recipientRef.current?.contains(event.target as Node)) setIsRecipientOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRecipientOpen(false);
        setIsConfirmOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!to.trim() || !from.trim() || !body.trim()) return;

    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setMessageList((current) => [
      { id: Date.now(), to: to.trim(), from: from.trim(), body: body.trim() },
      ...current,
    ]);
    setTo("");
    setFrom("");
    setBody("");
    setIsConfirmOpen(false);
  };

  return (
    <section className="message-page" aria-labelledby="message-page-title">
      <h1 className="sr-only" id="message-page-title">MESSAGE</h1>
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
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="message-form__fields">
            <div className="message-form__field message-form__field--to" ref={recipientRef}>
              <span>To.</span>
              <button aria-expanded={isRecipientOpen} aria-haspopup="listbox" aria-label="받는 사람" className="message-form__recipient-trigger" type="button" onClick={() => setIsRecipientOpen((open) => !open)}>
                {to || "전체(모두)"}
                <picture className="message-form__recipient-arrow">
                  <source media="(max-width: 400px)" srcSet="/assets/figma/message/message-select-arrow-mobile.svg" />
                  <img alt="" src="/assets/figma/message/message-select-arrow-tab-mobile.svg" />
                </picture>
              </button>
              {isRecipientOpen && (
                <ul aria-label="받는 사람 선택" className="message-form__recipient-menu" role="listbox">
                  {recipientOptions.map((recipient) => (
                    <li key={recipient} aria-selected={to === recipient || (!to && recipient === "전체(모두)")} role="option">
                      <button type="button" onClick={() => { setTo(recipient); setIsRecipientOpen(false); }}>{recipient}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="message-form__field message-form__field--from">
              <span>From.</span>
              <input aria-label="보내는 사람" placeholder="보낸이" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
          </div>
          <label className="message-form__body">
            <span className="sr-only">메시지</span>
            <textarea aria-label="메시지" placeholder={"전시를 보며 떠오른 생각, 느낀 감정, 전하고 싶은 한마디로 이곳에 불을 붙여 주세요.\n여러분의 한마디가 ○○회 졸업전시를 더 뜨겁게 완성합니다"} value={body} onChange={(event) => setBody(event.target.value)} />
            <button type="submit">IGNITE</button>
          </label>
        </form>
      </div>
      <PageContainer className="message-list-container">
        <div className="message-list" aria-label="방명록 메시지 목록">
          {messageList.map((message) => <MessageCard key={message.id} message={message} />)}
        </div>
      </PageContainer>
      <SiteFooter />
      {isConfirmOpen && (
        <div aria-modal="true" className="message-confirm-modal" role="dialog" aria-labelledby="message-confirm-title">
          <div className="message-confirm-modal__panel">
            <div className="message-confirm-modal__copy">
              <h2 id="message-confirm-title">따뜻한 마음, 이대로 전할까요?</h2>
              <p>받는 사람을 다시 한 번 확인해주세요.</p>
            </div>
            <div className="message-confirm-modal__actions">
              <button className="message-confirm-modal__edit" type="button" onClick={() => setIsConfirmOpen(false)}>수정하기</button>
              <button className="message-confirm-modal__submit" type="button" onClick={handleConfirm}>메세지 전하기</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
