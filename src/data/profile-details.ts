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

export const PROFILE_TEXT_LIMITS = {
  introduction: { min: 80, max: 100 },
  interviewAnswer: { min: 100, max: 200 },
} as const;

export function isProfileTextLengthValid(
  text: string,
  limit: { min: number; max: number },
) {
  return text.length >= limit.min && text.length <= limit.max;
}

const INTRODUCTION_DRAFT =
  "브랜딩과 편집 디자인을 바탕으로 화면 안에서 정보를 명확하게 전달하는 방법을 탐구합니다. 전시를 통해 관람자의 시선과 경험을 연결하는 디자인을 만들고자 합니다.";

const INTERVIEW_ANSWER_DRAFTS = [
  "이번 졸업전시가 결과물을 선보이는 순간을 넘어, 관람자의 반응을 관찰하고 다음 작업의 방향을 구체화하는 출발점이 되기를 바랍니다. 여러 사람과 대화하며 더 넓은 맥락에서 디자인의 역할을 고민해 보고 싶습니다.",
  "기획부터 결과물 제작까지의 과정을 거치며 혼자 완성하는 디자인보다 의견을 나누고 조율하는 과정에서 더 선명한 답을 찾는다는 점을 발견했습니다. 낯선 피드백도 작업을 확장하는 중요한 재료로 받아들이게 되었습니다.",
] as const;

export const PROFILE_DETAILS: Readonly<Record<string, ProfileDetail>> = {
  "1": {
    id: "1",
    nameKo: "김서은",
    nameEn: "Seoeun Kim",
    introduction: INTRODUCTION_DRAFT,
    tags: ["BRANDING", "EDITORIAL", "UI/UX"],
    email: "pupu@naver.com",
    instagram: "2211pupu",
    portraitSrc: "/assets/figma/profile/profile-01.jpeg",
    workSrc: "/assets/figma/profile-detail/profile-01-work-01.png",
    interview: [
      {
        question: "이번 졸업전시가 자신에게 어떤 출발점이 되길 바라나요?",
        answer: INTERVIEW_ANSWER_DRAFTS[0],
      },
      {
        question: "이번 졸업전시를 진행하며 새롭게 발견한 자신의 모습은 무엇인가요?",
        answer: INTERVIEW_ANSWER_DRAFTS[1],
      },
    ],
  },
};

for (const detail of Object.values(PROFILE_DETAILS)) {
  if (!isProfileTextLengthValid(detail.introduction, PROFILE_TEXT_LIMITS.introduction)) {
    throw new Error(`프로필 ${detail.id}의 자기소개 글자 수가 제한을 벗어났습니다.`);
  }

  for (const item of detail.interview) {
    if (!isProfileTextLengthValid(item.answer, PROFILE_TEXT_LIMITS.interviewAnswer)) {
      throw new Error(`프로필 ${detail.id}의 인터뷰 답변 글자 수가 제한을 벗어났습니다.`);
    }
  }
}
