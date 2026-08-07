import { MainArtwork } from "@/components/main/main-artwork";

export default function HomePage() {
  return (
    <section className="relative isolate h-[var(--main-hero-height)] min-h-[calc(100dvh-var(--header-height))] overflow-hidden bg-[#001a27]" aria-labelledby="main-title">
      <h1 className="sr-only" id="main-title">
        2026 제42회 경북대학교 디자인학과 졸업전시회
      </h1>
      <MainArtwork />
    </section>
  );
}
