import type { Metadata } from "next";
import { SpacePage } from "@/components/space/space-page";

export const metadata: Metadata = {
  title: "SPACE | KNUD 2026 Graduation Exhibition",
  description: "경북대학교 SPACE 9 전시 배치도와 IGNITE 아카이브",
};

export default function SpaceRoute() {
  return <SpacePage />;
}
