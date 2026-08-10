import Image from "next/image";
import { AboutTeamCarousel } from "@/components/about/about-team-carousel";
import { SiteFooter } from "@/components/layout/site-footer";

const introduction = [
  "Ignite는 4년 동안 축적된 디자인적 고민과 가능성에 처음 불을 붙이는 순간을 의미한다. 잠재되어 있던 에너지가 졸업전시를 통해 하나의 불꽃으로 피어나고 더 큰 가능성을 향해 번져 나가는 시작을 담아낸다. 우리들이 4년 동안 축적해 온 경험과 가능성을 하나의 시작으로 연결하는 졸업전시로서, 단순히 결과물을 전시하는 공간을 넘어 각자의 개성과 도전 정신을 공유하고, 개개인의 가능성이 하나의 에너지로 모여 새로운 가치를 만들어내는 경험을 지향한다.",
  "전시는 하나의 불씨가 점화되어 큰 에너지로 확장되는 과정을 축적, 점화, 그리고 폭발의 세 단계로 구조화하였다. 이는 에너지가 생성되고 변화하며 퍼져 나가는 흐름을 의미하며, 전시의 내러티브와 비주얼 아이덴티티의 핵심 요소로 활용된다.",
  "이러한 흐름은 사자의 행동 양식에 비유하여, 축적은 힘을 모으는 순간, 점화는 목표를 향해 도약하는 순간, 폭발은 포효를 통해 에너지와 존재감이 주변으로 퍼져 나가는 모습으로 표현하였다.",
];

const professors = [
  "안지선",
  "조철희",
  "이경용",
  "이재민",
];

const committee = [
  ["졸업준비 위원회", "윤이지"],
  ["", "김가연"],
  ["기획팀", "윤이지 김가연 공예원 김지언 이다혜 현연이"],
  ["비주얼 브랜딩팀", "박규리 공예원 김민주 김은별 박수정 양혜연"],
  ["영상팀", "이다혜 이나경 이초원 이하늘"],
  ["웹팀", "김지언 김서은 김세직 이서윤"],
  ["편집팀", "현연이 김연수 임경민 조장원"],
];

const teams = [
  {
    name: "기획팀",
    members: "윤다빈 김가연 박규리 김지언 현연이 이다혜",
    image: "/assets/figma/about/planning-team.png",
    width: 690,
  },
  {
    name: "비주얼 브랜딩팀",
    members: "박규리 공예원 김민주 김은별 박수정 양혜연",
    image: "/assets/figma/about/branding-team.png",
    width: 706,
  },
  {
    name: "기획팀",
    members: "윤다빈 김가연 박규리 김지언 현연이 이다혜",
    image: "/assets/figma/about/planning-team.png",
    width: 690,
  },
  {
    name: "비주얼 브랜딩팀",
    members: "박규리 공예원 김민주 김은별 박수정 양혜연",
    image: "/assets/figma/about/branding-team.png",
    width: 706,
  },
];

export function AboutPage() {
  return (
    <div className="max-w-full overflow-x-clip bg-[#f1f1f1] text-[#111]">
      <section className="about-intro relative min-h-[1353px] overflow-hidden bg-[linear-gradient(180deg,#0dadfb_0%,#0dadfb_37%,#f1f1f1_77%)] px-[max(24px,11.82vw)] pt-[225px] pb-[220px] max-[1020px]:min-h-0 max-[1020px]:px-10 max-[1020px]:pt-28 max-[600px]:px-5 max-[600px]:pt-12 max-[600px]:pb-24">
        <div className="relative mx-auto h-[880px] max-w-[1471.5px] max-[1020px]:h-auto max-[1020px]:bg-[#fcd519] max-[1020px]:p-2.5">
          <Image alt="" aria-hidden className="absolute inset-0 h-full w-full max-[1020px]:hidden" height={900} src="/assets/figma/about/intro-panel-border.svg" unoptimized width={1492} />
          <Image alt="" aria-hidden className="absolute inset-[30px_19px_10px] h-[calc(100%-40px)] w-[calc(100%-38px)] max-[1020px]:hidden" height={819} src="/assets/figma/about/intro-panel-fill.svg" unoptimized width={1421} />
          <div className="relative grid h-full grid-cols-[490px_minmax(0,1fr)] gap-[50px] px-[85px] py-[90px] max-[1280px]:grid-cols-[minmax(320px,42%)_minmax(0,1fr)] max-[1280px]:gap-12 max-[1280px]:px-[6%] max-[1020px]:h-auto max-[1020px]:grid-cols-1 max-[1020px]:gap-12 max-[1020px]:bg-[#f1f1f1] max-[1020px]:px-12 max-[1020px]:py-16 max-[600px]:px-8 max-[600px]:py-10">
            <Image alt="2026 KNUD 졸업전시회 포스터" className="h-auto w-full max-w-[490px] self-center justify-self-center shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" height={694} loading="eager" src="/assets/figma/about/poster.png" unoptimized width={490} />
            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="text-[80px] leading-[1.3] font-bold tracking-[-0.04em] max-[1280px]:text-[clamp(3.5rem,6.25vw,5rem)] max-[600px]:text-[3.25rem]">IGNITE</h1>
              <p className="mt-0 text-[32px] leading-[1.3] font-bold tracking-[-0.04em] max-[600px]:text-[1.375rem]">잠자는 사자가 깨어난 순간</p>
              <div className="mt-6 space-y-6 text-[24px] leading-[1.55] tracking-[-0.04em] max-[1280px]:text-[clamp(1rem,1.875vw,1.5rem)] max-[600px]:mt-5 max-[600px]:space-y-4 max-[600px]:text-[0.9375rem]">
                {introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <a className="mt-6 text-[20px] leading-[1.3] tracking-[-0.04em] text-[#7e7e7e] underline underline-offset-4 max-[600px]:text-sm" href="https://www.instagram.com/knu_design_exhibition" rel="noreferrer" target="_blank">Instagram @knu_design_exhibition</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-[max(24px,7.81vw)] pt-[18px] pb-[260px] max-[1020px]:px-10 max-[1020px]:pb-32 max-[600px]:px-5 max-[600px]:pb-20">
        <h2 className="text-[80px] leading-[1.3] font-bold tracking-[-0.045em] max-[600px]:text-[3.25rem]">Offline Exhibition</h2>
        <div className="mt-[80px] grid grid-cols-[minmax(0,1fr)_minmax(420px,1.05fr)] items-end gap-[90px] max-[1280px]:gap-12 max-[1020px]:grid-cols-1 max-[1020px]:gap-14 max-[600px]:mt-10">
          <Image alt="경북대학교 스페이스 9 위치 지도" className="w-full max-w-[1093px] justify-self-center" height={690} src="/assets/figma/about/exhibition-map.png" unoptimized width={1093} />
          <div className="pb-0 max-[1020px]:max-w-[600px]">
            <p className="text-[32px] leading-[1.3] font-bold tracking-[-0.04em] max-[600px]:text-2xl">2026.10.20(화) — 10.31(토)</p>
            <dl className="mt-6 grid grid-cols-[63px_1fr] gap-x-[30px] text-[24px] leading-[1.3] tracking-[-0.04em] max-[600px]:text-base">
              <dt>오프닝</dt><dd>10.20(화) 15:00</dd>
              <dt>시간</dt><dd>09:00 - 18:00</dd>
            </dl>
            <h3 className="mt-[76px] text-[32px] leading-[1.3] font-bold tracking-[-0.04em] max-[600px]:mt-12 max-[600px]:text-2xl">경북대학교 스페이스 9</h3>
            <address className="mt-6 not-italic text-[24px] leading-[1.55] tracking-[-0.04em] max-[600px]:text-base">
              <p>대구 북구 대학로 80 경북대학교 스페이스 9</p>
              <p>80 Daehak-ro, Buk-gu Kyungpook National University SPACE 9</p>
            </address>
          </div>
        </div>
      </section>

      <section className="relative min-h-[855px] overflow-hidden pt-[55px] max-[1020px]:min-h-0 max-[1020px]:pb-28 max-[600px]:pb-16">
        <h2 className="relative z-10 ml-[max(24px,7.81vw)] text-[80px] leading-[1.3] font-bold tracking-[-0.045em] max-[600px]:ml-5 max-[600px]:text-[3.25rem]">Professors</h2>
        <div className="relative mt-[-3px] h-[720px] max-[1020px]:mt-8 max-[1020px]:h-auto max-[1020px]:bg-[#0dadfb] max-[1020px]:px-10 max-[1020px]:py-16 max-[600px]:px-5 max-[600px]:py-12">
          <Image alt="" aria-hidden className="absolute inset-0 h-full w-[min(81.875%,1572px)] object-fill max-[1020px]:hidden" height={720} src="/assets/figma/about/professors-wave.svg" unoptimized width={1572} />
          <Image alt="" aria-hidden className="absolute bottom-0 left-[55.36%] h-[895px] w-[657px] max-[1280px]:left-[52%] max-[1020px]:hidden" height={895} src="/assets/figma/about/professors-lion.png" unoptimized width={657} />
          <div className="relative z-10 ml-[max(24px,7.81vw)] grid w-[670px] grid-cols-2 gap-x-[325px] gap-y-10 pt-[255px] text-[24px] leading-[1.3] tracking-[-0.04em] max-[1020px]:ml-0 max-[1020px]:w-full max-[1020px]:max-w-[620px] max-[1020px]:gap-x-12 max-[1020px]:pt-0 max-[600px]:grid-cols-1 max-[600px]:gap-y-7 max-[600px]:text-lg">
            {professors.map((name) => (
              <div key={name}>
                <p>경북대학교 디자인학과 교수</p>
                <p className="mt-2 text-[32px] font-bold max-[600px]:text-2xl">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[1062px] overflow-hidden pt-[118px] max-[1020px]:min-h-0 max-[1020px]:pt-28 max-[600px]:pt-16">
        <h2 className="relative z-10 ml-auto mr-[max(24px,7.81vw)] max-w-[789px] text-[80px] leading-[1.1] font-bold tracking-[-0.055em] max-[1020px]:mx-10 max-[1020px]:max-w-none max-[600px]:mx-5 max-[600px]:text-[3.25rem]">Graduation Committee Members</h2>
        <div className="relative mt-4 h-[720px] max-[1020px]:mt-8 max-[1020px]:h-auto max-[1020px]:bg-[#0dadfb] max-[1020px]:px-10 max-[1020px]:py-16 max-[600px]:px-5 max-[600px]:py-12">
          <Image alt="" aria-hidden className="absolute inset-0 ml-auto h-full w-[min(81.875%,1572px)] object-fill max-[1020px]:hidden" height={720} src="/assets/figma/about/committee-wave.svg" unoptimized width={1572} />
          <Image alt="" aria-hidden className="absolute bottom-[41px] left-[14.58%] h-[326px] w-[527px] max-[1020px]:hidden" height={326} src="/assets/figma/about/committee-illustration.png" unoptimized width={527} />
          <div className="relative z-10 ml-auto mr-[max(24px,7.81vw)] grid max-w-[1063px] grid-cols-[210px_194px_194px_1fr] gap-y-5 pt-[203px] text-[24px] leading-[1.3] tracking-[-0.04em] max-[1020px]:mx-0 max-[1020px]:max-w-[780px] max-[1020px]:grid-cols-[190px_1fr] max-[1020px]:gap-x-8 max-[1020px]:gap-y-4 max-[1020px]:pt-0 max-[600px]:grid-cols-1 max-[600px]:gap-y-1 max-[600px]:text-base">
            <div className="contents max-[1020px]:hidden"><p>졸업준비 위원회</p><p>윤이지</p></div>
            <div className="contents max-[1020px]:hidden"><p></p><p>김가연</p></div>
            {committee.slice(2).map(([role, members]) => <div className="contents" key={role}><p>{role}</p><p>{members}</p></div>)}
            <div className="hidden max-[1020px]:contents"><p>졸업준비 위원회</p><p>윤이지 · 김가연</p></div>
          </div>
        </div>
      </section>

      <section className="pt-[90px] pb-[130px] max-[1020px]:pt-20 max-[1020px]:pb-24 max-[600px]:pt-14 max-[600px]:pb-16">
        <AboutTeamCarousel teams={teams} />
      </section>
      <SiteFooter />
    </div>
  );
}
