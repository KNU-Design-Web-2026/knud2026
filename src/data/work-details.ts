import { WORK_ITEMS } from "@/data/work-items";

export type WorkDetail = {
  artistEn: string;
  artistEnMobile: string;
  artistEnTab: string;
  artistKo: string;
  category: string;
  email: string;
  heroSrc: string;
  instagram: string;
  storyEn: string;
  storyKo: string;
  title: string;
};

const FIGMA_WORK_DETAIL: Omit<WorkDetail, "artistEn" | "artistEnMobile" | "artistEnTab" | "artistKo"> = {
  category: "UI/UX",
  email: "leeseoyun0561@naver.com",
  heroSrc: "/assets/figma/work/work-detail-hero.png",
  instagram: "2222seoyun",
  storyEn:
    "In a quiet seam between moments stood a small, ancient repair shop that preserved forgotten memories. Every night, the shopkeeper sat under warm light, polishing worn pocket watches and faded photographs, gently tending to the traces of time left behind. On a rainy evening, a young wanderer with drenched clothes opened the door. In his hands, he held a stopped watch. \"This watch stopped in my brightest season, long ago,\" he said, his voice laced with nostalgia. \"Is it possible to make it move again?\" The shopkeeper took the watch and examined its internal gears through a magnifying glass. As he carefully brushed away the accumulated dust, the tiny cogwheels found their rhythm and began to mesh together once more. A crisp, rhythmic ticking soon filled the quiet room. \"We cannot turn back time, but we can allow a frozen heart to flow again,\" the shopkeeper said with a warm smile as he handed the watch back. The wanderer held it close to his chest and stepped back out into the night, his steps noticeably lighter than when he had arrived. Outside, the rain had cleared, and soft moonlight illuminated his path forward.",
  storyKo:
    "시간의 틈새에는 잊힌 이들의 기억을 보관하는 작고 오래된 수선점이 있었다. 주인은 매일 밤 손때 묻은 시계와 빛바랜 사진들을 닦으며 누군가의 조용한 추억을 정성스레 어루만졌다. 어느 날 빗소리와 함께 젖은 옷을 입은 젊은 나그네가 문을 열고 들어왔다. 그의 손에는 멈춰 선 태엽 시계 하나가 쥐어져 있었다. 나그네는 낮고 아련한 목소리로 말했다. \"이 시계는 오래전 흘려보낸 나의 가장 눈부셨던 계절에서 멈춰 버렸습니다. 다시 움직이게 할 수 있을까요?\" 주인은 가만히 시계를 받아 들고 돋보기 넘어 톱니바퀴를 살폈다. 겉면에 묻은 먼지를 털어내자 작고 촘촘한 톱니들이 마침내 원래의 궤도를 찾아 물물 맞물리기 시작했다. 째깍거리는 맑은 소리가 조용한 공간을 가득 채웠다. \"시간을 다시 돌릴 수는 없지만, 멈춰 있던 마음을 다시 흐르게 할 수는 있지요.\" 주인은 미소를 지으며 시계를 건넸다. 나그네는 묵묵히 시계를 품에 안았다. 문을 열고 나서는 그의 발걸음은 들어올 때보다 훨씬 가벼워져 있었다. 밖에는 어느덧 비가 그치고 맑은 달빛이 길을 환히 비추고 있었다.",
  title: "PROJECT NAME",
};

export const WORK_DETAILS: Readonly<Record<string, WorkDetail>> = Object.fromEntries(
  WORK_ITEMS.map((item) => [
    String(item.id),
    {
      ...FIGMA_WORK_DETAIL,
      artistEn: item.id === 1 ? "Seoyun Lee" : item.artistEn,
      artistEnMobile: item.id === 1 ? "Seoyun Lee" : item.artistEnMobile,
      artistEnTab: item.id === 1 ? "Seoyun Lee" : item.artistEnTab,
      artistKo: item.id === 1 ? "이서윤" : item.artistKo,
    },
  ]),
);
