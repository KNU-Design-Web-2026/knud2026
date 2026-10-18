import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/data/work-items";
import { WorkCardText } from "@/components/work/work-card-text";

type WorkCardProps = {
  eager?: boolean;
  item: WorkItem;
};

export function WorkCard({ eager = false, item }: WorkCardProps) {
  return (
    <Link aria-label={`${item.title} 상세 보기`} className="work-card" href={`/work/${item.id}`}>
      <div className="work-card__image">
        <Image
          alt={`${item.title} - ${item.artistKo}`}
          className="absolute top-0 left-[-14.99%] h-full w-[129.98%] max-w-none object-cover"
          fill
          quality={95}
          placeholder={item.blurDataURL ? "blur" : "empty"}
          blurDataURL={item.blurDataURL}
          loading={eager ? "eager" : "lazy"}
          sizes="(min-width: 1350.0625px) 20vw, (min-width: 1020.0625px) 25vw, (min-width: 600.0625px) 33vw, 50vw"
          src={item.imageSrc}
        />
      </div>
      <div className="work-card__detail">
        <h2 className="work-card__title"><span className="work-card__fit-text">{item.title}</span></h2>
        <div className={`work-card__artists${item.artistKo.includes(" & ") ? " work-card__artists--joint" : ""}`}>
          <p className="work-card__artist-ko">{item.artistKo}</p>
          <p className="work-card__artist-en work-card__artist-en--web"><WorkCardText>{item.artistEn}</WorkCardText></p>
          <p className="work-card__artist-en work-card__artist-en--tab"><WorkCardText>{item.artistEnTab}</WorkCardText></p>
          <p className="work-card__artist-en work-card__artist-en--mobile"><WorkCardText>{item.artistEnMobile}</WorkCardText></p>
        </div>
      </div>
    </Link>
  );
}
