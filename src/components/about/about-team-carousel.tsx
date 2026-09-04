"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import styles from "./about-team-carousel.module.css";

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
  const drag = useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") {
      delete event.currentTarget.dataset.mouseScroll;
      return;
    }
    if (event.button !== 0) return;

    const track = event.currentTarget;
    // 마우스를 놓은 위치를 유지한다. snap을 즉시 복원하면 가까운 카드로 튄다.
    track.dataset.mouseScroll = "true";
    drag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: track.scrollLeft };
    track.dataset.dragging = "true";
    track.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const activeDrag = drag.current;
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

    event.currentTarget.scrollLeft = activeDrag.scrollLeft - (event.clientX - activeDrag.startX);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;

    drag.current = null;
    const track = event.currentTarget;
    delete track.dataset.dragging;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  }

  return (
    <div className={styles.carousel} data-about-reveal="rise">
      <div
        className={styles.track}
        role="region"
        aria-label="졸업준비팀 소개"
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {teams.map((team, index) => (
          <article className={styles.card} key={`${team.name}-${index}`}>
            <Image alt={`${team.name} 단체 사진`} className={styles.image} draggable={false} height={2731} src={team.image} unoptimized width={team.width} />
            <div className={styles.caption}>
              <p className="font-bold">{team.name}</p>
              <p>{team.members}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
