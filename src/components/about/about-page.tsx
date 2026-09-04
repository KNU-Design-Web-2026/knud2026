import Image from "next/image";
import { AboutMotion } from "@/components/about/about-motion";
import { AboutTeamCarousel } from "@/components/about/about-team-carousel";
import { SiteFooter } from "@/components/layout/site-footer";
import styles from "./about-page.module.css";

const fullIntroduction = [
  "IGNITE는 우리가 4년 동안 축적해 온 디자인적 고민을 더 큰 가능성으로 확장하는 첫 점화의 순간을 의미한다. 잠재되어 있던 에너지가 졸업전시를 통해 하나의 불꽃으로 피어나고, 더 큰 가능성을 향해 번져 나가는 시작을 담아낸다. 이 전시는 4년 동안 축적해 온 경험과 가능성을 새로운 시작으로 연결하며, 단순히 결과물을 선보이는 것을 넘어 각자의 개성과 도전 정신을 공유하고, 개개인의 가능성이 하나의 에너지로 모여 새로운 가치를 만들어가는 장을 지향한다.",
  "전시는 하나의 불씨가 점화되어 큰 에너지로 확장되는 과정을 축적, 점화, 폭발의 세 단계로 구조화하였다. 이는 에너지가 생성되고 변화하며 확산되는 흐름을 의미하며, 전시의 내러티브와 비주얼 아이덴티티를 구성하는 핵심 요소로 활용하였다.",
  "이러한 흐름을 사자의 행동에 비유하여, 축적은 도약을 위해 힘을 모으는 순간, 점화는 목표를 향해 도약하는 순간, 폭발은 사자의 포효와 함께 에너지와 존재감이 주변으로 확산되는 모습으로 표현하였다.",
];

const compactIntroduction = [
  "Ignite는 4년 동안 축적된 디자인적 고민과 가능성에 처음 불을 붙이는 순간을 의미한다. 잠재되어 있던 에너지가 졸업 전시를 통해 하나의 불꽃으로 피어나고, 더 큰 가능성을 향해 번져 나가는 시작을 담아낸다.",
  "Ignite는 학생들이 4년 동안 축적해 온 경험과 가능성을 하나의 시작으로 연결하는 졸업전시이다. 단순히 결과물을 전시하는 공간을 넘어, 각자의 개성과 도전 정신을 공유하고 새로운 출발을 응원하는 상징적인 공간을 지향한다. 또한 서로 다른 시선과 다양한 디자인 언어가 하나의 전시 안에서 조화를 이루며, 학생 개개인의 가능성이 하나의 에너지로 모여 새로운 가치를 만들어내는 경험을 제공하고자 한다.",
];

const professors = ["이경용", "조철희", "안지선", "이재민"];

const committee = [
  ["기획팀", "윤이지 김가연 김지언 박규리 이다혜 현연이"],
  ["비주얼 브랜딩팀", "박규리 공예원 김민주 김은별 박수정 양혜연"],
  ["영상팀", "이다혜 이나경 이초원 이하늘"],
  ["웹팀", "김지언 김서은 김세직 이서윤"],
  ["편집팀", "현연이 김연수 임경민 조장원"],
];

const teams = [
  { name: "기획팀", members: "윤이지 김가연 김지언 박규리 이다혜 현연이", image: "/assets/figma/about/planning-team.jpg", width: 4096 },
  { name: "비주얼 브랜딩팀", members: "박규리 공예원 김민주 김은별 박수정 양혜연", image: "/assets/figma/about/branding-team.jpg", width: 4096 },
  { name: "영상팀", members: "이다혜 이나경 이초원 이하늘", image: "/assets/figma/about/planning-team.jpg", width: 4096 },
  { name: "웹팀", members: "김지언 김서은 김세직 이서윤", image: "/assets/figma/about/branding-team.jpg", width: 4096 },
  { name: "편집팀", members: "현연이 김연수 임경민 조장원", image: "/assets/figma/about/planning-team.jpg", width: 4096 },
];

function IntroductionCopy({ compact = false }: { compact?: boolean }) {
  const paragraphs = compact ? compactIntroduction : fullIntroduction;

  return (
    <div className={styles.introductionCopy}>
      <div className={styles.introductionBody}>
        <h1>잠자는 사자가 깨어난 순간</h1>
        <div className={styles.introductionParagraphs}>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
      <a href="https://www.instagram.com/knu_design_exhibition" rel="noreferrer" target="_blank">Instagram @knu_design_exhibition</a>
    </div>
  );
}

function ExhibitionInformation() {
  return (
    <div className={styles.exhibitionInformation}>
      <div>
        <strong>2026.10.20(화) — 10.31(토)</strong>
        <dl>
          <div><dt>오프닝</dt><dd>10.20(화) 15:00</dd></div>
          <div><dt>시간</dt><dd>09:00 - 18:00</dd></div>
        </dl>
      </div>
      <div>
        <strong>경북대학교 스페이스 9</strong>
        <p>대구 북구 대학로 80 경북대학교 스페이스 9<br />80 Daehak-ro, Buk-gu<br />Kyungpook National University SPACE 9</p>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className={styles.page} data-about-page>
      <section className={styles.introSection}>
        <div className={styles.introWide} data-about-reveal="scale" data-about-depth>
          <div className={styles.introWideInner}>
            <Image alt="2026 KNUD 졸업전시회 포스터" className={styles.posterWide} height={4096} loading="eager" priority src="/assets/figma/about/poster.png" unoptimized width={2893} />
            <IntroductionCopy />
          </div>
        </div>

        <div className={styles.introNarrow} data-about-reveal="scale">
          <Image alt="2026 KNUD 졸업전시회 포스터" className={styles.posterNarrow} data-about-depth height={4096} loading="eager" priority src="/assets/figma/about/poster.png" unoptimized width={2893} />
          <div className={styles.introNarrowFrame} data-about-depth>
            <div className={styles.introNarrowInner}><IntroductionCopy compact /></div>
          </div>
        </div>
      </section>

      <main className={styles.mainContent}>
        <section className={styles.offlineSection}>
          <h2 data-about-reveal="rise">Offline Exhibition</h2>
          <Image alt="2026 KNUD 오프라인 전시 위치와 관람 안내" className={styles.offlineWide} data-about-reveal="rise" height={1076} src="/assets/figma/about/offline-exhibition-detail.png" unoptimized width={3240} />
          <div className={styles.offlineNarrow} data-about-reveal="rise">
            <div className={styles.mapCrop}>
              <Image alt="경북대학교 스페이스 9 전시 위치 지도" height={1076} src="/assets/figma/about/offline-exhibition-detail.png" unoptimized width={3240} />
            </div>
            <ExhibitionInformation />
          </div>
        </section>

        <section className={styles.professorsSection}>
          <h2 data-about-reveal="rise">Professors</h2>
          <div className={styles.professorsPanel} data-about-reveal="rise">
            <picture className={styles.panelPaper}>
              <source media="(max-width: 400px)" srcSet="/assets/figma/about/professors-wave-mobile.svg" />
              <source media="(max-width: 821px)" srcSet="/assets/figma/about/professors-wave-tab-mobile.svg" />
              <img alt="" src="/assets/figma/about/professors-wave.svg" />
            </picture>
            <div className={styles.professorsGrid}>
              {professors.map((name) => (
                <div key={name}>
                  <p>경북대학교 디자인학과 교수</p>
                  <strong>{name}</strong>
                </div>
              ))}
            </div>
            <Image
              alt=""
              aria-hidden
              className={`${styles.professorsLion} ${styles.professorsLionWide}`}
              height={895}
              src="/assets/figma/about/professors-lion-transparent.png"
              unoptimized
              width={657}
            />
            <Image
              alt=""
              aria-hidden
              className={`${styles.professorsLion} ${styles.professorsLionNarrow}`}
              height={216}
              src="/assets/figma/about/professors-lion-tab-mobile.svg"
              unoptimized
              width={225}
            />
          </div>
        </section>

        <section className={styles.committeeSection}>
          <h2 data-about-reveal="rise"><span>Graduation</span><span>Committee Members</span></h2>
          <div className={styles.committeePanel} data-about-reveal="rise">
            <picture className={styles.panelPaper}>
              <source media="(max-width: 400px)" srcSet="/assets/figma/about/committee-wave-mobile.svg" />
              <source media="(max-width: 821px)" srcSet="/assets/figma/about/committee-wave-tab-mobile.svg" />
              <img alt="" src="/assets/figma/about/committee-wave.svg" />
            </picture>
            <div className={styles.committeeInformation}>
              <div className={styles.committeeChairs}>
                <strong>졸업준비 위원회</strong>
                <span className={styles.chairNames}>
                  <span>윤이지</span>
                  <span>김가연</span>
                </span>
              </div>
              <div className={styles.committeeTeams}>
                {committee.map(([role, members]) => (
                  <div key={role}><strong>{role}</strong><span>{members}</span></div>
                ))}
              </div>
            </div>
            <Image alt="" aria-hidden className={styles.committeeIllustration} height={326} src="/assets/figma/about/committee-illustration-transparent.png" unoptimized width={527} />
          </div>
        </section>

        <section className={styles.teamsSection}><AboutTeamCarousel teams={teams} /></section>
      </main>
      <SiteFooter />
      <AboutMotion />
    </div>
  );
}
