import Image from "next/image";
import type { WorkItem } from "@/data/work-items";

type WorkCardProps = {
  item: WorkItem;
};

export function WorkCard({ item }: WorkCardProps) {
  return (
    <article className="work-card flex min-w-0 flex-col" tabIndex={0}>
      <div className="work-card__image relative aspect-[384/280] overflow-hidden">
        <Image
          alt={`${item.title} - ${item.artistKo}`}
          className="absolute top-0 left-[-14.99%] h-full w-[129.98%] max-w-none object-cover"
          fill
          sizes="(min-width: 1300px) 20vw, 100vw"
          src={item.imageSrc}
        />
      </div>
      <div className="work-card__detail flex flex-col items-start gap-2 bg-[#f2f2f2] pt-3.5 pb-4 pl-[1.125rem] leading-[1.3] tracking-[-0.2px] text-black">
        <h2 className="w-full text-2xl font-bold">{item.title}</h2>
        <div className="flex items-center gap-[1.625rem] whitespace-nowrap text-center text-lg">
          <p className="font-bold">{item.artistKo}</p>
          <p>{item.artistEn}</p>
        </div>
      </div>
    </article>
  );
}
