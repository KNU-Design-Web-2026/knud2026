import { notFound } from "next/navigation";
import { ProfileDetailPage } from "@/components/profile/profile-detail-page";
import { PROFILE_DETAILS } from "@/data/profile-details";

type ProfileDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfileDetailRoute({ params }: ProfileDetailRouteProps) {
  const { id } = await params;
  const detail = PROFILE_DETAILS[id];

  if (!detail) {
    notFound();
  }

  return <ProfileDetailPage detail={detail} />;
}
