import { PROFILE_MEMBERS } from "@/data/profile-members";
import { PROFILE_SHEET_CONTENT } from "@/data/profile-sheet-content";

export type ProfileDetail = {
  id: string;
  nameKo: string;
  nameEn: string;
  projectName: string;
  introduction: string | null;
  tags: readonly string[];
  email: string;
  instagram: string | null;
  behance: string | null;
  portraitSrc: string;
  interview: readonly {
    question: string;
    answer: string;
  }[];
};

const INTERVIEW_QUESTIONS = [
  "자신을 움직이게 만드는 불씨는 무엇인가요?",
  "이번 졸업전시를 진행하며 새롭게 발견한 자신의 모습은 무엇인가요?",
] as const;

export const PROFILE_DETAILS: Readonly<Record<string, ProfileDetail>> = Object.fromEntries(
  PROFILE_MEMBERS.map((member) => {
    const content = PROFILE_SHEET_CONTENT[member.nameKo];

    if (!content) {
      throw new Error(`프로필 ${member.nameKo}의 시트 데이터가 없습니다.`);
    }

    return [
      String(member.id),
      {
        id: String(member.id),
        nameKo: member.nameKo,
        nameEn: member.nameEn,
        projectName: content.projectName,
        introduction: content.introduction,
        tags: content.tags,
        email: content.email,
        instagram: content.instagram,
        behance: content.behance,
        portraitSrc: member.imageSrc,
        interview: content.answers?.map((answer, index) => ({
          question: INTERVIEW_QUESTIONS[index],
          answer,
        })) ?? [],
      } satisfies ProfileDetail,
    ];
  }),
);
