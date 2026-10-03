import Image from "next/image";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import type { ProfileDetail } from "@/data/profile-details";

type ProfileDetailPageProps = {
  detail: ProfileDetail;
};

function SectionTitle({ children, id }: { children: string; id: string }) {
  return (
    <div className="profile-detail__section-title flex items-center gap-[4.75rem]">
      <h2 className="profile-detail__section-heading shrink-0 text-[2.5rem] leading-[1.3] font-bold tracking-[-0.096px] text-[#050505]" id={id}>{children}</h2>
      <Image alt="" aria-hidden="true" className="h-[2px] min-w-0 flex-1" height={2} src="/assets/figma/profile-detail/section-line.svg" width={1348} />
    </div>
  );
}

export function ProfileDetailPage({ detail }: ProfileDetailPageProps) {
  return (
    <section aria-labelledby="profile-detail-title" className="profile-detail bg-white pt-[5rem]" data-contact-layout={detail.behance || detail.instagram ? "social" : "mail-only"}>
      <PageContainer className="profile-detail__container">
        <div className="profile-detail__content flex flex-col gap-[5rem] pb-[5rem]">
          <article className="profile-detail__intro flex items-end gap-[3.6875rem]">
            <Image alt={`${detail.nameKo} 프로필 이미지`} className="profile-detail__portrait h-[31.8125rem] w-[23.3125rem] object-cover" height={683} priority src={detail.portraitSrc} width={500} />
            <div className="profile-detail__copy flex min-w-0 flex-col gap-[4.375rem]">
              <div className="profile-detail__identity flex flex-col gap-[1.625rem]">
                <div className="profile-detail__names flex w-[13.375rem] flex-col gap-[0.3125rem] font-bold text-[#050505]">
                  <h1 className="profile-detail__name-ko text-[3.75rem] leading-[1.3] tracking-[-0.16px]" id="profile-detail-title">{detail.nameKo}</h1>
                  <p className="profile-detail__name-en text-[2.375rem] leading-[1.3] tracking-[-0.096px]">{detail.nameEn}</p>
                </div>
                <p className="profile-detail__introduction max-w-[61rem] text-[1.375rem] leading-[1.3] tracking-[-0.048px] text-[#050505]">{detail.introduction ?? "소개 준비 중"}</p>
              </div>
              <div className="profile-detail__meta flex w-[23.625rem] flex-col gap-[1.5rem] text-[1.375rem] leading-[1.3] tracking-[-0.048px] text-[#050505]">
                <ul className="profile-detail__tags flex flex-wrap gap-x-[3.25rem] gap-y-2.5 text-[1.375rem] text-[#848484]">
                  {detail.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                <dl className="profile-detail__contact grid grid-cols-[max-content_minmax(0,1fr)] gap-x-[4.75rem] gap-y-2">
                  <dt className="font-bold">Mail</dt>
                  <dd className="min-w-0 [overflow-wrap:anywhere]"><a href={`mailto:${detail.email}`}>{detail.email}</a></dd>
                  {detail.behance && <>
                    <dt className="font-bold">Behance</dt>
                    <dd className="min-w-0 [overflow-wrap:anywhere]"><a href={`https://${detail.behance}`} rel="noopener noreferrer" target="_blank">{detail.behance}</a></dd>
                  </>}
                  {detail.instagram && <>
                    <dt className="font-bold">Instagram</dt>
                    <dd className="min-w-0 [overflow-wrap:anywhere]"><a href={`https://www.instagram.com/${detail.instagram}/`} rel="noopener noreferrer" target="_blank">@{detail.instagram}</a></dd>
                  </>}
                </dl>
              </div>
            </div>
          </article>

          <section aria-labelledby="interview-title" className="profile-detail__section flex flex-col gap-[3.75rem]">
            <SectionTitle id="interview-title">Interview</SectionTitle>
            <div className="profile-detail__interview-list flex flex-col gap-[2.5rem]">
              {detail.interview.length === 0 && <p className="text-[1.375rem]">인터뷰 준비 중</p>}
              {detail.interview.map((item) => (
                <article className="profile-detail__interview-item grid grid-cols-2 gap-0 text-[1.375rem] leading-[1.3] tracking-[-0.048px] text-[#050505]" key={item.question}>
                  <h3 className="font-bold">{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="work-title" className="profile-detail__section flex flex-col gap-[4.375rem]">
            <SectionTitle id="work-title">Work</SectionTitle>
            <div className="profile-detail__work-copy flex flex-col gap-3 text-[#050505]">
              <h3 className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold">{detail.projectName}</h3>
              <p className="text-[1.375rem]">작품 이미지는 준비 중입니다.</p>
            </div>
          </section>
        </div>
      </PageContainer>
      <SiteFooter />
    </section>
  );
}
