export type ProfileDetail = {
  id: string;
  nameKo: string;
  nameEn: string;
  introduction: string;
  tags: readonly string[];
  email: string;
  instagram: string;
  portraitSrc: string;
  workSrc: string;
  interview: readonly {
    question: string;
    answer: string;
  }[];
};

const ANSWER_PLACEHOLDER = "대답 ".repeat(46).trim();

export const PROFILE_DETAILS: Readonly<Record<string, ProfileDetail>> = {
  "1": {
    id: "1",
    nameKo: "김서은",
    nameEn: "Seoeun Kim",
    introduction: ANSWER_PLACEHOLDER,
    tags: ["BRANDING", "EDITORIAL", "UI/UX"],
    email: "pupu@naver.com",
    instagram: "2211pupu",
    portraitSrc: "/assets/figma/profile/profile-01.jpeg",
    workSrc: "/assets/figma/profile-detail/profile-01-work-01.png",
    interview: [
      {
        question: "이번 졸업전시가 자신에게 어떤 출발점이 되길 바라나요?",
        answer: ANSWER_PLACEHOLDER,
      },
      {
        question: "이번 졸업전시를 진행하며 새롭게 발견한 자신의 모습은 무엇인가요?",
        answer: ANSWER_PLACEHOLDER,
      },
    ],
  },
};
