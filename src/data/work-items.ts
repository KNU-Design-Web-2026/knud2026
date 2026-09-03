import { PROFILE_MEMBERS } from "@/data/profile-members";

export type WorkItem = {
  artistEn: string;
  artistEnMobile: string;
  artistEnTab: string;
  artistKo: string;
  id: number;
  imageSrc: string;
  title: string;
};

const ARTIST_NAMES = [
  "공예원",
  "김가연",
  "김민주",
  "김서은",
  "김세직",
  "김연수",
  "김은별",
  "김지언",
  "박규리 & 이다혜",
  "박수정",
  "양혜연",
  "윤이지",
  "이나경",
  "이서윤",
  "이초원",
  "이하늘",
  "임경민",
  "조장원",
  "현연이",
] as const;

const PROFILE_ENGLISH_BY_KOREAN = new Map(
  PROFILE_MEMBERS.map((member) => [member.nameKo, member.nameEn]),
);

function matchArtistEnglishName(artistKo: string) {
  return artistKo
    .split(" & ")
    .map((name) => PROFILE_ENGLISH_BY_KOREAN.get(name) ?? name)
    .join(" & ");
}

export const WORK_ITEMS: readonly WorkItem[] = Array.from(
  { length: 19 },
  (_, index) => {
    const artistKo = ARTIST_NAMES[index];
    const matchedArtistEn = matchArtistEnglishName(artistKo);

    return {
      artistEn: index === 8 ? "규리 박 & 다혜 이" : matchedArtistEn,
      artistEnMobile: index === 8 ? "KR & DH" : matchedArtistEn,
      artistEnTab: index === 8 ? "PKR & LDH" : matchedArtistEn,
      artistKo,
      id: index + 1,
      imageSrc: "/assets/figma/work/work-placeholder.png",
      title: "작품이름",
    };
  },
);
