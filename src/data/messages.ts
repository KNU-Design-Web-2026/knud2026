export type Message = {
  id: number;
  to: string;
  body: string;
  from: string;
};

const sample: Omit<Message, "id"> = {
  to: "김철수",
  body: "철수야 졸업 축하해!\n졸전 준비 진짜 열심히 한 거 같더라!\n앞으로도 응원해",
  from: "김수철",
};

export const messages: Message[] = Array.from({ length: 84 }, (_, index) => ({
  ...sample,
  id: index + 1,
}));
