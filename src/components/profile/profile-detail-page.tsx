import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import type { ProfileDetail } from "@/data/profile-details";

type ProfileDetailPageProps = {
  detail: ProfileDetail;
};

function SectionTitle({ children, id }: { children: string; id: string }) {
  return (
    <div className="flex items-center gap-[3.75rem]">
      <h2 className="shrink-0 text-[3rem] leading-[1.25] font-bold tracking-[-0.04em] text-[#050505]" id={id}>{children}</h2>
      <Image alt="" aria-hidden="true" className="h-[2px] min-w-0 flex-1" height={2} src="/assets/figma/profile-detail/section-line.svg" width={1348} />
    </div>
  );
}

export function ProfileDetailPage({ detail }: ProfileDetailPageProps) {
  return (
    <section aria-labelledby="profile-detail-title" className="bg-white pt-[6.25rem]">
      <PageContainer className="!px-[9.375rem]">
        <div className="flex flex-col gap-[7.5rem] pb-[7.5rem]">
          <article className="grid grid-cols-[35rem_minmax(0,1fr)] items-end gap-[5.375rem]">
            <Image alt={`${detail.nameKo} 프로필 이미지`} className="h-[47.8125rem] w-[35rem] object-cover" height={765} priority src={detail.portraitSrc} width={560} />
            <div className="flex min-w-0 flex-col gap-[7.75rem] pb-[0.1875rem]">
              <div className="flex flex-col gap-[2.4375rem]">
                <div className="flex items-end gap-2.5">
                  <h1 className="text-[5rem] leading-[1.2] font-bold tracking-[-0.06em] text-[#050505]" id="profile-detail-title">{detail.nameKo}</h1>
                  <p className="pb-[0.25rem] text-[3rem] leading-[1.2] font-bold tracking-[-0.04em] text-[#050505]">{detail.nameEn}</p>
                </div>
                <p className="max-w-[61rem] text-[1.5rem] leading-[1.5] tracking-[-0.04em] text-[#050505]">{detail.introduction}</p>
              </div>
              <div className="flex flex-col gap-[4.3125rem] text-[1.5rem] leading-[1.4] tracking-[-0.04em] text-[#050505]">
                <ul className="flex flex-wrap gap-x-[3.75rem] gap-y-2.5 text-[1.25rem] text-[#848484]">
                  {detail.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                <dl className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-2.5">
                  <dt className="font-bold">Mail</dt><dd>{detail.email}</dd>
                  <dt className="font-bold">Instagram</dt><dd>{detail.instagram}</dd>
                </dl>
              </div>
            </div>
          </article>

          <section aria-labelledby="interview-title" className="flex flex-col gap-[4.375rem]">
            <SectionTitle id="interview-title">Interview</SectionTitle>
            <div className="grid grid-cols-2 gap-[4.75rem]">
              {detail.interview.map((item) => (
                <article className="flex flex-col gap-6 text-[1.5rem] leading-[1.5] tracking-[-0.04em] text-[#050505]" key={item.question}>
                  <h3 className="font-bold">{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="work-title" className="flex flex-col gap-[4.375rem]">
            <SectionTitle id="work-title">Work</SectionTitle>
            <Image alt={`${detail.nameKo} 졸업전시 작업`} className="h-[56.25rem] w-full object-cover" height={900} src={detail.workSrc} width={1620} />
          </section>
        </div>
      </PageContainer>
      <SiteFooter />
    </section>
  );
}
