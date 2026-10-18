import { PROFILE_MEMBERS } from "@/data/profile-members";
import { PROFILE_SHEET_CONTENT } from "@/data/profile-sheet-content";
import { SUBMITTED_WORKS } from "@/data/submitted-works";
import { WORK_INTRODUCTIONS } from "@/data/work-introductions";
import leeNagyeongPreview from "../../public/assets/works/lee-nagyeong/thumbnail-preview.json";

export type WorkItem = {
  artistEn: string;
  artistEnMobile: string;
  artistEnTab: string;
  artistKo: string;
  id: number;
  imageSrc: string;
  blurDataURL?: string;
  spaceImageSrc: string;
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

// Thumbnail-only approvals must not enable unapproved detail/SPACE images.
const WORK_THUMBNAIL_OVERRIDES: Readonly<Record<string, string>> = {
  "이나경": "/assets/works/lee-nagyeong/thumbnail.webp",
};

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
    const submitted = SUBMITTED_WORKS[artistKo];

    return {
      artistEn: index === 8 ? "PKR & LDH" : matchedArtistEn,
      artistEnMobile: index === 8 ? "KR & DH" : matchedArtistEn,
      artistEnTab: index === 8 ? "PKR & LDH" : matchedArtistEn,
      artistKo,
      id: index + 1,
      imageSrc: submitted?.thumbnail.src ?? WORK_THUMBNAIL_OVERRIDES[artistKo] ?? "/assets/figma/work/work-placeholder.png",
      blurDataURL: submitted?.thumbnail.blurDataURL ?? (artistKo === "이나경" ? leeNagyeongPreview.blurDataURL : undefined),
      spaceImageSrc: submitted?.space.src ?? "/assets/figma/work/work-placeholder.png",
      title: submitted || WORK_INTRODUCTIONS[artistKo]
        ? PROFILE_SHEET_CONTENT[artistKo.split(" & ")[0]].projectName.replace(/\s*\/\s*\(한글 표기 필요할 시[^)]*\)/, "")
        : "작품이름",
    };
  },
);
