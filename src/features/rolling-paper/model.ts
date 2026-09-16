export const RECIPIENT_OPTIONS = [
  "전체(모두)", "공예원", "김가연", "김민주", "김서은", "김세직", "김연수",
  "김은별", "김지언", "박규리", "박수정", "양혜연", "윤이지", "이나경",
  "이다혜", "이서윤", "이초원", "이하늘", "임경민", "조장원", "현연이",
] as const;

export const DEFAULT_RECIPIENT = RECIPIENT_OPTIONS[0];
export const LETTER_SENDER_MAX_LENGTH = 20;
export const LETTER_LIST_LIMIT = 100;

export type Recipient = (typeof RECIPIENT_OPTIONS)[number];

export type Letter = {
  id: string;
  to: Recipient;
  from: string;
  body: string;
  createdAt: string;
};

export type CreateLetterInput = Pick<Letter, "to" | "from" | "body">;
