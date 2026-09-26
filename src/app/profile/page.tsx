import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProfileCard } from "@/components/profile/profile-card";
import { PROFILE_MEMBERS } from "@/data/profile-members";

export const metadata: Metadata = {
  title: "참여 작가",
  description: "2026 경북대학교 디자인학과 졸업 전시회 참여 작가를 소개합니다.",
};

export default function ProfilePage() {
  return (
    <section className="bg-white pt-[var(--profile-page-top-gap)]" aria-labelledby="profile-title">
      <h1 className="sr-only" id="profile-title">
        2026 경북대학교 디자인학과 졸업전시회 참여자 프로필
      </h1>
      <div className="profile-grid pb-[var(--profile-page-top-gap)]">
        {PROFILE_MEMBERS.map((member, index) => (
          <ProfileCard eager={index < 4} key={member.id} member={member} />
        ))}
      </div>
      <SiteFooter />
    </section>
  );
}
