import gongYewon from "../../public/assets/works/gong-yewon/manifest.json";
import kimYeonsu from "../../public/assets/works/kim-yeonsu/manifest.json";
import kimEunbyeol from "../../public/assets/works/kim-eunbyeol/manifest.json";
import leeChowon from "../../public/assets/works/lee-chowon/manifest.json";
import joJangwon from "../../public/assets/works/jo-jangwon/manifest.json";

export type WorkImage = { src: string; width: number; height: number };
export type SubmittedWork = {
  artist: string;
  thumbnail: WorkImage;
  space: WorkImage;
  hero: WorkImage;
  images: readonly WorkImage[];
};

export const SUBMITTED_WORKS: Readonly<Record<string, SubmittedWork>> = {
  [gongYewon.artist]: gongYewon,
  [kimYeonsu.artist]: kimYeonsu,
  [kimEunbyeol.artist]: kimEunbyeol,
  [leeChowon.artist]: leeChowon,
  [joJangwon.artist]: joJangwon,
};
