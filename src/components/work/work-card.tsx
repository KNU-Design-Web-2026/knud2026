import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/data/work-items";

type WorkCardProps = {
  item: WorkItem;
};

export function WorkCard({ item }: WorkCardProps) {
  return (
    <Link aria-label={`${item.title} 상세 보기`} className="work-card" href={`/work/${item.id}`}>
      <div className="work-card__image">
        <Image
          alt={`${item.title} - ${item.artistKo}`}
          className="absolute top-0 left-[-14.99%] h-full w-[129.98%] max-w-none object-cover"
          fill
          sizes="(min-width: 1350.0625px) 20vw, (min-width: 1020.0625px) 25vw, (min-width: 600.0625px) 33vw, 50vw"
          src={item.imageSrc}
        />
      </div>
      <div className="work-card__detail">
        <h2 className="work-card__title">{item.title}</h2>
        <div className="work-card__artists">
          <p className="work-card__artist-ko">{item.artistKo}</p>
          <p className="work-card__artist-en work-card__artist-en--web">{item.artistEn}</p>
          <p className="work-card__artist-en work-card__artist-en--tab">{item.artistEnTab}</p>
          <p className="work-card__artist-en work-card__artist-en--mobile">{item.artistEnMobile}</p>
        </div>
      </div>
    </Link>
  );
}
