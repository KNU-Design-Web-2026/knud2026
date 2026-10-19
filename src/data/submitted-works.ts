import gongYewon from "../../public/assets/works/gong-yewon/manifest.json";
import kimYeonsu from "../../public/assets/works/kim-yeonsu/manifest.json";
import kimEunbyeol from "../../public/assets/works/kim-eunbyeol/manifest.json";
import leeChowon from "../../public/assets/works/lee-chowon/manifest.json";
import joJangwon from "../../public/assets/works/jo-jangwon/manifest.json";
import kimGayeon from "../../public/assets/works/kim-gayeon/manifest.json";
import kimMinju from "../../public/assets/works/kim-minju/manifest.json";
import parkSujeong from "../../public/assets/works/park-sujeong/manifest.json";
import yangHyeyeon from "../../public/assets/works/yang-hyeyeon/manifest.json";
import yoonIji from "../../public/assets/works/yoon-iji/manifest.json";
import leeSeoyun from "../../public/assets/works/lee-seoyun/manifest.json";
import leeHaneul from "../../public/assets/works/lee-haneul/manifest.json";
import limKyungmin from "../../public/assets/works/lim-kyungmin/manifest.json";
import hyunYeoni from "../../public/assets/works/hyun-yeoni/manifest.json";
import kimSejik from "../../public/assets/works/kim-sejik/manifest.json";
import kimJieon from "../../public/assets/works/kim-jieon/manifest.json";
import parkGyuriLeeDahye from "../../public/assets/works/park-gyuri-lee-dahye/manifest.json";

export type WorkImage = { src: string; width: number; height: number; blurDataURL?: string; animated?: boolean; stillSrc?: string };
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
  [kimGayeon.artist]: kimGayeon,
  [kimMinju.artist]: kimMinju,
  [parkSujeong.artist]: parkSujeong,
  [yangHyeyeon.artist]: yangHyeyeon,
  [yoonIji.artist]: yoonIji,
  [leeSeoyun.artist]: leeSeoyun,
  [leeHaneul.artist]: leeHaneul,
  [limKyungmin.artist]: limKyungmin,
  [hyunYeoni.artist]: hyunYeoni,
  [kimSejik.artist]: kimSejik,
  [kimJieon.artist]: kimJieon,
  [parkGyuriLeeDahye.artist]: parkGyuriLeeDahye,
};
