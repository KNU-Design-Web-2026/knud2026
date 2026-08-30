import { SiteFooter } from "@/components/layout/site-footer";
import { WorkCard } from "@/components/work/work-card";
import { WORK_ITEMS } from "@/data/work-items";

export default function WorkPage() {
  return (
    <section aria-labelledby="work-title" className="bg-white pt-20">
      <h1 className="sr-only" id="work-title">2026 경북대학교 디자인학과 졸업전시회 작품</h1>
      <div className="grid grid-cols-4 gap-7 px-[9.375rem] pb-20">
        {WORK_ITEMS.map((item) => <WorkCard item={item} key={item.id} />)}
      </div>
      <SiteFooter />
    </section>
  );
}
