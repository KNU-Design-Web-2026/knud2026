import { MainArtwork } from "@/components/main/main-artwork";
import { MainCursor } from "@/components/main/main-cursor";

export default function HomePage() {
  return (
    <section className="main-hero relative isolate h-[var(--main-hero-height)] min-h-[calc(100dvh-var(--header-height))] overflow-hidden bg-[#001a27]" id="main-hero" aria-labelledby="main-title">
      <h1 className="sr-only" id="main-title">
        2026 제42회 경북대학교 디자인학과 졸업전시회
      </h1>
      <MainArtwork />
      <MainCursor />
    </section>
  );
}
