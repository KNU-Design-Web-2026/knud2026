import Image from "next/image";
import { SiteFooter } from "@/components/layout/site-footer";
import type { WorkDetail } from "@/data/work-details";
import { getWorkImagePlaceholder } from "@/lib/work-image-placeholder";

type WorkDetailPageProps = {
  detail: WorkDetail;
};

export function WorkDetailPage({ detail }: WorkDetailPageProps) {
  const emails = detail.emails ?? [{ artistKo: detail.artistKo, email: detail.email }];
  return (
    <article className="work-detail bg-white" data-submitted={Boolean(detail.images)} data-introduction={Boolean(detail.hasSubmittedIntroduction)} data-clarity-unmask="true">
      <section aria-labelledby="work-detail-title" className="work-detail__hero" style={detail.heroSize ? { aspectRatio: `${detail.heroSize.width} / ${detail.heroSize.height}` } : undefined}>
        <Image
          alt={`${detail.title} 대표 이미지`}
          className="object-cover"
          fill
          quality={95}
          placeholder={getWorkImagePlaceholder(detail.heroBlurDataURL)}
          priority
          sizes="100vw"
          src={detail.heroSrc}
        />
      </section>

      <div className="work-detail__content">
        <div className="work-detail__identity">
          <header className="work-detail__heading">
            <p className="work-detail__category">{detail.category}</p>
            <div className="work-detail__title-group">
              <h1 id="work-detail-title">{detail.title}</h1>
              <p>
                {detail.artistKo} &nbsp;
                <span className="work-detail__artist-en work-detail__artist-en--web">{detail.artistEn}</span>
                <span className="work-detail__artist-en work-detail__artist-en--tab">{detail.artistEnTab}</span>
                <span className="work-detail__artist-en work-detail__artist-en--mobile">{detail.artistEnMobile}</span>
              </p>
            </div>
          </header>

          <address className="work-detail__contact" data-clarity-mask="true">
            {emails.map((contact) => <a href={`mailto:${contact.email}`} key={contact.artistKo}>
              <Image alt="이메일" height={32} src="/assets/figma/work/work-detail-mail.svg" width={32} />
              <span>{emails.length > 1 && <span className="work-detail__contact-name">{contact.artistKo} · </span>}{contact.email}</span>
            </a>)}
            {detail.instagram && <a href={`https://www.instagram.com/${detail.instagram}`} rel="noreferrer" target="_blank">
              <Image alt="Instagram" height={32} src="/assets/figma/work/work-detail-instagram.svg" width={32} />
              <span>{detail.instagram}</span>
            </a>}
          </address>
        </div>

        {(detail.storyKo || detail.storyEn) && <section aria-label="프로젝트 소개" className="work-detail__story">
          <p lang="ko">{detail.storyKo}</p>
          <p lang="en">{detail.storyEn}</p>
        </section>}
      </div>

      {detail.images ? <section aria-label={`${detail.title} 상세 작품 이미지`} className="work-detail__portfolio">
        {detail.images.map((image, index) => <picture className="block" key={image.src}>
          {image.stillSrc && <source media="(prefers-reduced-motion: reduce)" srcSet={image.stillSrc} />}
          <Image
          alt={`${detail.title} — ${detail.artistKo} 작품 상세 ${index + 1}`}
          src={image.src} width={image.width} height={image.height}
          unoptimized={image.animated}
          placeholder={getWorkImagePlaceholder(image.blurDataURL)}
          sizes="100vw" quality={95} loading="lazy" decoding="async"
          className="block h-auto w-full"
        /></picture>)}
      </section> : <div aria-label="추가 프로젝트 이미지 영역" className="work-detail__additional-artwork" />}
      <SiteFooter />
    </article>
  );
}
