export type ProfileMember = {
  id: number;
  imageSrc: string;
  nameKo: string;
  nameEn: string;
};

const PROFILE_IMAGE_PATH = "/assets/figma/profile";

const PROFILE_NAMES = [
  ["공예원", "Gong Yewon"],
  ["김가연", "Kim Gayeon"],
  ["김민주", "Kim Minju"],
  ["김서은", "Kim Seoeun"],
  ["김세직", "Kim Sejik"],
  ["김연수", "Kim Yeonsu"],
  ["김은별", "Kim Eunbyeol"],
  ["김지언", "Kim Jieon"],
  ["박규리", "Park Gyuri"],
  ["박수정", "Park Sujeong"],
  ["양혜연", "Yang Hyeyeon"],
  ["윤이지", "Yoon Iji"],
  ["이나경", "Lee Nagyeong"],
  ["이다혜", "Lee Dahye"],
  ["이서윤", "Lee Seoyun"],
  ["이초원", "Lee Chowon"],
  ["이하늘", "Lee Haneul"],
  ["임경민", "Lim Gyeongmin"],
  ["조장원", "Cho Jangwon"],
  ["현연이", "Hyeon Yeoni"],
] as const;

export const PROFILE_MEMBERS: readonly ProfileMember[] = Array.from(
  { length: PROFILE_NAMES.length },
  (_, index) => ({
    id: index + 1,
    imageSrc: `${PROFILE_IMAGE_PATH}/profile-${String(index + 1).padStart(2, "0")}.jpeg`,
    nameKo: PROFILE_NAMES[index][0],
    nameEn: PROFILE_NAMES[index][1],
  }),
);
