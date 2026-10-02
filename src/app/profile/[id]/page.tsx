import { notFound } from "next/navigation";
import { ProfileDetailPage } from "@/components/profile/profile-detail-page";
import { PROFILE_DETAILS } from "@/data/profile-details";
import { PROFILE_MEMBERS } from "@/data/profile-members";

type ProfileDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return PROFILE_MEMBERS.map(({ id }) => ({ id: String(id) }));
}

export default async function ProfileDetailRoute({ params }: ProfileDetailRouteProps) {
  const { id } = await params;
  const detail = PROFILE_DETAILS[id];

  if (!detail) {
    notFound();
  }

  return <ProfileDetailPage detail={detail} />;
}
