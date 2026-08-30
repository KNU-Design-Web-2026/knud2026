import { SiteFooter } from "@/components/layout/site-footer";
import { WorkCard } from "@/components/work/work-card";
import { WORK_ITEMS } from "@/data/work-items";

export default function WorkPage() {
  return (
    <section aria-labelledby="work-title" className="work-page bg-white">
      <h1 className="sr-only" id="work-title">2026 경북대학교 디자인학과 졸업전시회 작품</h1>
      <div className="work-grid">
        {WORK_ITEMS.map((item) => <WorkCard item={item} key={item.id} />)}
      </div>
      <SiteFooter />
    </section>
  );
}
