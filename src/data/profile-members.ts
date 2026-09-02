export type ProfileMember = {
  id: number;
  imageSrc: string;
  nameKo: string;
  nameEn: string;
};

const PROFILE_IMAGE_PATH = "/assets/figma/profile";

const PROFILE_NAMES = [
  ["공예원", "Yewon Gong"],
  ["김가연", "Gayeon Kim"],
  ["김민주", "Minju Kim"],
  ["김서은", "Seoeun Kim"],
  ["김세직", "Sejik Kim"],
  ["김연수", "Yeonsu Kim"],
  ["김은별", "Eunbyeol Kim"],
  ["김지언", "Jieon Kim"],
  ["박규리", "Gyuri Park"],
  ["박수정", "Sujeong Park"],
  ["양혜연", "Hyeyeon Yang"],
  ["윤이지", "Iji Yoon"],
  ["이나경", "Nagyeong Lee"],
  ["이다혜", "Dahye Lee"],
  ["이서윤", "Seoyun Lee"],
  ["이초원", "Chowon Lee"],
  ["이하늘", "Haneul Lee"],
  ["임경민", "Gyeongmin Lim"],
  ["조장원", "Jangwon Cho"],
  ["현연이", "Yeoni Hyeon"],
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
