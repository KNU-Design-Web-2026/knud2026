"use client";

import Image from "next/image";
import { useRef } from "react";

type Team = {
  image: string;
  members: string;
  name: string;
  width: number;
};

type AboutTeamCarouselProps = {
  teams: Team[];
};

export function AboutTeamCarousel({ teams }: AboutTeamCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const moveCards = (direction: "next" | "previous") => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? carousel.clientWidth * 0.82 : carousel.clientWidth * -0.82,
    });
  };

  return (
    <div className="relative max-w-full overflow-hidden" data-about-reveal="rise">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f1f1f1] to-transparent max-[600px]:w-5" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f1f1f1] to-transparent max-[600px]:w-5" />
      <div ref={carouselRef} className="flex snap-x snap-mandatory gap-[50px] overflow-x-auto overscroll-x-contain px-[max(24px,8.17vw)] pb-6 [scrollbar-width:none] touch-pan-x max-[600px]:gap-5 max-[600px]:px-5 [&::-webkit-scrollbar]:hidden" role="region" aria-label="졸업준비팀 소개">
        {teams.map((team, index) => (
          <article className="w-[min(706px,calc(100vw-80px))] shrink-0 snap-start max-[600px]:w-[calc(100vw-64px)]" key={`${team.name}-${index}`}>
            <Image alt={`${team.name} 단체 사진`} className="h-auto w-full" height={517} src={team.image} unoptimized width={team.width} />
            <div className="mx-auto mt-6 w-[62%] text-[24px] leading-[1.3] tracking-[-0.04em] max-[600px]:w-[76%] max-[600px]:text-base">
              <p className="font-bold">{team.name}</p>
              <p className="mt-2">{team.members}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="relative z-20 mx-[max(24px,8.17vw)] mt-2 flex justify-end gap-3 max-[600px]:mx-5">
        <button aria-label="이전 팀 보기" className="grid size-11 place-items-center rounded-full border border-[#111] text-xl transition-colors hover:bg-[#111] hover:text-white focus-visible:bg-[#111] focus-visible:text-white" type="button" onClick={() => moveCards("previous")}>←</button>
        <button aria-label="다음 팀 보기" className="grid size-11 place-items-center rounded-full border border-[#111] text-xl transition-colors hover:bg-[#111] hover:text-white focus-visible:bg-[#111] focus-visible:text-white" type="button" onClick={() => moveCards("next")}>→</button>
      </div>
    </div>
  );
}
