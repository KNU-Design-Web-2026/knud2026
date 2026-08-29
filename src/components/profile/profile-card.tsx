import Image from "next/image";
import type { ProfileMember } from "@/data/profile-members";

type ProfileCardProps = {
  member: ProfileMember;
};

export function ProfileCard({ member }: ProfileCardProps) {
  return (
    <article
      aria-label={`${member.nameKo} ${member.nameEn} 프로필`}
      className="profile-card group/profile-card flex aspect-[413/543] items-center px-[var(--profile-card-padding-x)] py-[var(--profile-card-padding-y)]"
      tabIndex={0}
    >
      <div className="profile-card__image relative h-full w-full">
        <Image
          alt={`${member.nameKo} 프로필 이미지`}
          className="h-full w-full object-cover"
          height={499}
          sizes="(min-width: 1920px) 375px, 19.6vw"
          src={member.imageSrc}
          width={375}
        />
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className="profile-card__border pointer-events-none absolute inset-0 h-full w-full"
        height={543}
        src="/assets/figma/profile-hover-border.svg"
        width={413}
      />
      <div className="profile-card__detail pointer-events-none absolute inset-x-0 bottom-0 flex h-[16.94%] items-center bg-knud-navigation-active px-[1.875rem]">
        <p className="flex items-center gap-6 whitespace-nowrap leading-[1.3] tracking-[-0.2px] text-knud-ink">
          <span className="text-[2rem] font-bold">{member.nameKo}</span>
          <span className="text-[1.5rem]">{member.nameEn}</span>
        </p>
      </div>
    </article>
  );
}
