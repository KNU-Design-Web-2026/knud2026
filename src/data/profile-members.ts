export type ProfileMember = {
  id: number;
  imageSrc: string;
  nameKo: string;
  nameEn: string;
};

const PROFILE_IMAGE_PATH = "/assets/figma/profile";

export const PROFILE_MEMBERS: readonly ProfileMember[] = Array.from(
  { length: 20 },
  (_, index) => ({
    id: index + 1,
    imageSrc: `${PROFILE_IMAGE_PATH}/profile-${String(index + 1).padStart(2, "0")}.jpeg`,
    nameKo: "이서윤",
    nameEn: "Seoyun Lee",
  }),
);
