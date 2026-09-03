"use client";

import Image from "next/image";
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
  return (
    <div className={styles.carousel} data-about-reveal="rise">
      <div className={styles.track} role="region" aria-label="졸업준비팀 소개">
        {teams.map((team, index) => (
          <article className={styles.card} key={`${team.name}-${index}`}>
            <Image alt={`${team.name} 단체 사진`} className={styles.image} height={2731} src={team.image} unoptimized width={team.width} />
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
