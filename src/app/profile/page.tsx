import { SiteFooter } from "@/components/layout/site-footer";
import { ProfileCard } from "@/components/profile/profile-card";
import { PROFILE_MEMBERS } from "@/data/profile-members";

export default function ProfilePage() {
  return (
    <section className="bg-white pt-[var(--profile-page-top-gap)]" aria-labelledby="profile-title">
      <h1 className="sr-only" id="profile-title">
        2026 경북대학교 디자인학과 졸업전시회 참여자 프로필
      </h1>
      <div className="grid grid-cols-4 gap-x-[var(--profile-grid-column-gap)] gap-y-[var(--profile-grid-row-gap)] px-[var(--profile-grid-gutter)] pb-[var(--profile-page-top-gap)]">
        {PROFILE_MEMBERS.map((member) => (
          <ProfileCard key={member.id} member={member} />
        ))}
      </div>
      <SiteFooter />
    </section>
  );
}
