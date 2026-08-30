import { notFound } from "next/navigation";
import { WorkDetailPage } from "@/components/work/work-detail-page";
import { WORK_DETAILS } from "@/data/work-details";

type WorkDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkDetailRoute({ params }: WorkDetailRouteProps) {
  const { id } = await params;
  const detail = WORK_DETAILS[id];

  if (!detail) {
    notFound();
  }

  return <WorkDetailPage detail={detail} />;
}
