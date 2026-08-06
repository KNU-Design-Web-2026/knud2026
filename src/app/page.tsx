import { MainArtwork } from "@/components/main/main-artwork";

export default function HomePage() {
  return (
    <section className="relative isolate aspect-[8/5] min-h-[32rem] overflow-hidden bg-[linear-gradient(180deg,#06affd_56.697%,#001a27_100%)] max-[600px]:min-h-[25rem]" aria-labelledby="main-title">
      <h1 className="sr-only" id="main-title">
        2026 제42회 경북대학교 디자인학과 졸업전시회
      </h1>
      <MainArtwork />
    </section>
  );
}
