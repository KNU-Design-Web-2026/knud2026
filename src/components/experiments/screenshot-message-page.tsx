"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: number;
  to: string;
  from: string;
  body: string;
};

const initialMessages: Message[] = Array.from({ length: 21 }, (_, index) => ({
  id: index,
  to: "김철수",
  from: "김수철",
  body: "철수야 졸업 축하해!\n졸전 준비 진짜 열심히 한 거 같더라!\n앞으로도 응원해",
}));

export function ScreenshotMessagePage() {
  const [messages, setMessages] = useState(initialMessages);
  const [to, setTo] = useState("전체(모두)");
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!body.trim()) {
      return;
    }

    setMessages((current) => [
      {
        id: Date.now(),
        to,
        from: from.trim() || "익명",
        body: body.trim(),
      },
      ...current,
    ]);
    setBody("");
  };

  return (
    <section className="screenshot-message-baseline" aria-labelledby="screenshot-message-title">
      <h1 className="sr-only" id="screenshot-message-title">
        졸업전시 축하 메시지
      </h1>
      <div className="screenshot-message-baseline__art" aria-hidden="true" />
      <form className="screenshot-message-baseline__form" onSubmit={submitMessage}>
        <div className="screenshot-message-baseline__fields">
          <label>
            <strong>To.</strong>
            <select aria-label="받는 사람" value={to} onChange={(event) => setTo(event.target.value)}>
              <option>전체(모두)</option>
              <option>김철수</option>
              <option>김서은</option>
            </select>
          </label>
          <label>
            <strong>From.</strong>
            <input aria-label="보내는 사람" placeholder="보낸이" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
        </div>
        <div className="screenshot-message-baseline__textarea-wrap">
          <textarea
            aria-label="메시지 내용"
            placeholder="전시를 보며 떠오른 생각, 느낀 감정, 전하고 싶은 한마디로 이곳에 불을 붙여 주세요.\n여러분의 한마디가 ○○회 졸업전시를 더 뜨겁게 완성합니다"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <button type="submit">IGNITE</button>
        </div>
      </form>
      <div className="screenshot-message-baseline__messages" aria-live="polite">
        {messages.map((message) => (
          <article className="screenshot-message-baseline__card" key={message.id}>
            <p className="screenshot-message-baseline__to">To. {message.to}</p>
            <p className="screenshot-message-baseline__body">
              {message.body.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <p className="screenshot-message-baseline__from">From. {message.from}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
