import Image from "next/image";
import type { ProfileMember } from "@/data/profile-members";

type ProfileCardProps = {
  member: ProfileMember;
};

export function ProfileCard({ member }: ProfileCardProps) {
  return (
    <article className="flex aspect-[413/543] items-center px-[var(--profile-card-padding-x)] py-[var(--profile-card-padding-y)]">
      <Image
        alt={`졸업전시 참여자 프로필 이미지 ${member.id}`}
        className="h-full w-full object-cover"
        height={499}
        sizes="(min-width: 1920px) 375px, 19.6vw"
        src={member.imageSrc}
        width={375}
      />
    </article>
  );
}
