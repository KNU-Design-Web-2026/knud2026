import { WORK_ITEMS } from "@/data/work-items";

export function getSpaceWork(artistKo: string) {
  const work = WORK_ITEMS.find(item => item.artistKo === artistKo);
  if (!work) throw new Error(`지도 부스의 작품 정보가 없습니다: ${artistKo}`);
  return work;
}
