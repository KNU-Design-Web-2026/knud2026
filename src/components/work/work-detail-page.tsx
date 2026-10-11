import Image from "next/image";
import { SiteFooter } from "@/components/layout/site-footer";
import type { WorkDetail } from "@/data/work-details";

type WorkDetailPageProps = {
  detail: WorkDetail;
};

export function WorkDetailPage({ detail }: WorkDetailPageProps) {
  return (
    <article className="work-detail bg-white" data-submitted={Boolean(detail.images)}>
      <section aria-labelledby="work-detail-title" className="work-detail__hero" style={detail.heroSize ? { aspectRatio: `${detail.heroSize.width} / ${detail.heroSize.height}` } : undefined}>
        <Image
          alt={`${detail.title} 대표 이미지`}
          className="object-cover"
          fill
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

          <address className="work-detail__contact">
            <a href={`mailto:${detail.email}`}>
              <Image alt="이메일" height={32} src="/assets/figma/work/work-detail-mail.svg" width={32} />
              <span>{detail.email}</span>
            </a>
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
        {detail.images.map((image, index) => <Image
          key={image.src}
          alt={`${detail.title} — ${detail.artistKo} 작품 상세 ${index + 1}`}
          src={image.src} width={image.width} height={image.height}
          sizes="100vw" loading="lazy" decoding="async"
          className="block h-auto w-full"
        />)}
      </section> : <div aria-label="추가 프로젝트 이미지 영역" className="work-detail__additional-artwork" />}
      <SiteFooter />
    </article>
  );
}
