export type WorkItem = {
  artistEn: string;
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
  "김지연",
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

export const WORK_ITEMS: readonly WorkItem[] = Array.from(
  { length: 19 },
  (_, index) => ({
    artistEn: "Seoyun Lee",
    artistKo: ARTIST_NAMES[index],
    id: index + 1,
    imageSrc: "/assets/figma/work/work-placeholder.png",
    title: "작품이름",
  }),
);
