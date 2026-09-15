import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "전시 소개",
  description:
    "IGNITE의 주제와 일정, 경북대학교 디자인학과 제42회 졸업 전시회 정보를 확인하세요.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
