import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import type { ProfileDetail } from "@/data/profile-details";

type ProfileDetailPageProps = {
  detail: ProfileDetail;
};

function SectionTitle({ children, id }: { children: string; id: string }) {
  return (
    <div className="profile-detail__section-title flex items-center gap-[3.75rem]">
      <h2 className="profile-detail__section-heading shrink-0 text-[3rem] leading-[1.3] font-bold tracking-[-0.096px] text-[#050505]" id={id}>{children}</h2>
      <Image alt="" aria-hidden="true" className="h-[2px] min-w-0 flex-1" height={2} src="/assets/figma/profile-detail/section-line.svg" width={1348} />
    </div>
  );
}

export function ProfileDetailPage({ detail }: ProfileDetailPageProps) {
  return (
    <section aria-labelledby="profile-detail-title" className="profile-detail bg-white pt-[6.25rem]">
      <PageContainer className="profile-detail__container">
        <div className="profile-detail__content flex flex-col gap-[7.5rem] pb-[7.5rem]">
          <article className="profile-detail__intro grid grid-cols-[31.25rem_minmax(0,1fr)] items-end gap-[5.375rem]">
            <Image alt={`${detail.nameKo} 프로필 이미지`} className="profile-detail__portrait h-[42.6875rem] w-[31.25rem] object-cover" height={683} priority src={detail.portraitSrc} width={500} />
            <div className="profile-detail__copy flex min-w-0 flex-col gap-[7.75rem]">
              <div className="profile-detail__identity flex flex-col gap-[2.4375rem]">
                <div className="profile-detail__names flex w-[16.875rem] flex-col gap-2.5 font-bold text-[#050505]">
                  <h1 className="profile-detail__name-ko text-[5rem] leading-[1.3] tracking-[-0.16px]" id="profile-detail-title">{detail.nameKo}</h1>
                  <p className="profile-detail__name-en text-[3rem] leading-[1.3] tracking-[-0.096px]">{detail.nameEn}</p>
                </div>
                <p className="profile-detail__introduction max-w-[61rem] text-[1.5rem] leading-[1.3] tracking-[-0.048px] text-[#050505]">{detail.introduction}</p>
              </div>
              <div className="profile-detail__meta flex flex-col gap-[4.3125rem] text-[1.5rem] leading-[1.3] tracking-[-0.048px] text-[#050505]">
                <ul className="profile-detail__tags flex flex-wrap gap-x-[3.75rem] gap-y-2.5 text-[1.25rem] text-[#848484]">
                  {detail.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                <dl className="profile-detail__contact flex gap-[4.25rem]">
                  <div className="font-bold"><dt>Mail</dt><dt>Instagram</dt></div>
                  <div><dd>{detail.email}</dd><dd>{detail.instagram}</dd></div>
                </dl>
              </div>
            </div>
          </article>

          <section aria-labelledby="interview-title" className="profile-detail__section flex flex-col gap-[4.375rem]">
            <SectionTitle id="interview-title">Interview</SectionTitle>
            <div className="profile-detail__interview-list flex flex-col gap-[3.75rem]">
              {detail.interview.map((item) => (
                <article className="profile-detail__interview-item grid grid-cols-2 gap-[4.75rem] text-[1.5rem] leading-[1.3] tracking-[-0.048px] text-[#050505]" key={item.question}>
                  <h3 className="font-bold">{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="work-title" className="profile-detail__section flex flex-col gap-[4.375rem]">
            <SectionTitle id="work-title">Work</SectionTitle>
            <figure className="profile-detail-work" tabIndex={0}>
              <Image alt={`${detail.nameKo} 졸업전시 작업`} className="h-full w-full object-cover" height={900} src={detail.workSrc} width={1620} />
              <figcaption className="profile-detail-work__overlay">PROJECT NAME</figcaption>
            </figure>
          </section>
        </div>
      </PageContainer>
      <SiteFooter />
    </section>
  );
}
