import Image from "next/image";
import Link from "next/link";
import type { ProfileMember } from "@/data/profile-members";

type ProfileCardProps = {
  member: ProfileMember;
};

export function ProfileCard({ member }: ProfileCardProps) {
  const cardSurface = (
    <div className="profile-card__surface">
      <div className="profile-card__image relative h-full w-full">
        <Image
          alt={`${member.nameKo} 프로필 이미지`}
          className="h-full w-full object-cover"
          height={499}
          sizes="(min-width: 1351px) 19.6vw, (min-width: 1021px) 28vw, (min-width: 601px) 44.2vw, 45.25vw"
          src={member.imageSrc}
          width={375}
        />
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border profile-card__border--desktop pointer-events-none"
        height={543}
        src="/assets/figma/profile-hover-border.svg"
        width={413}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border profile-card__border--web-tab pointer-events-none"
        height={424}
        src="/assets/figma/profile-hover-border-web-tab.svg"
        width={319}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border profile-card__border--tab pointer-events-none"
        height={418}
        src="/assets/figma/profile-hover-border-tab.svg"
        width={315}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border profile-card__border--tab-mobile pointer-events-none"
        height={353}
        src="/assets/figma/profile-hover-border-tab-mobile.svg"
        width={265}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border profile-card__border--mobile pointer-events-none"
        height={241}
        src="/assets/figma/profile-hover-border-mobile.svg"
        width={181}
      />
      <div className="profile-card__detail pointer-events-none absolute inset-x-0 bottom-0 flex h-[var(--profile-detail-height)] items-center justify-start bg-knud-navigation-active px-[var(--profile-detail-padding-x)]">
        <p className="flex items-center justify-start gap-[var(--profile-detail-gap)] whitespace-nowrap leading-[1.3] tracking-[-0.2px] text-knud-ink">
          <span className="text-[length:var(--profile-detail-name-size)] font-bold">{member.nameKo}</span>
          <span className="text-[length:var(--profile-detail-name-en-size)]">{member.nameEn}</span>
        </p>
      </div>
    </div>
  );

  if (member.id === 1) {
    return (
      <Link
        aria-label={`${member.nameKo} ${member.nameEn} 프로필 상세 보기`}
        className="profile-card group/profile-card block"
        href={`/profile/${member.id}`}
      >
        {cardSurface}
      </Link>
    );
  }

  return (
    <article
      aria-label={`${member.nameKo} ${member.nameEn} 프로필`}
      className="profile-card group/profile-card"
      tabIndex={0}
    >
      {cardSurface}
    </article>
  );
}
