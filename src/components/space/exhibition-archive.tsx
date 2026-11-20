import photos from "@/data/exhibition-archive.json";

import { ExhibitionArchiveReveal } from "./exhibition-archive-reveal";
import styles from "./space-page.module.css";

const assetDirectory = "/assets/archive-2026";
const thumbnailWidths = [480, 800, 1280];
const thumbnailSizes = "(max-width: 821px) 46vw, (max-width: 1700px) 31vw, (max-width: 1920px) 515px, 27.5vw";

// Keep broad views wide and give focal details more height. Coarse tracks let
// the full gallery flow continuously without hundreds of tracks per column.
const frameRows: Partial<Record<string, number>> = {
  "032": 17, "033": 12, "034": 17, "036": 17,
  "039": 16, "040": 19, "042": 16, "043": 12,
  "044": 13, "046": 16, "048": 17, "049": 13,
  "050": 16, "053": 13, "056": 17, "058": 13,
  "061": 19, "062": 15, "063": 17, "064": 13,
  "068": 12, "071": 18, "072": 16, "074": 19,
  "076": 14, "077": 16, "078": 14, "079": 19,
  "080": 15, "081": 12, "082": 12, "084": 19,
  "085": 15, "086": 12, "087": 18, "088": 17,
  "089": 14, "090": 17, "092": 14, "094": 19,
  "095": 15, "096": 13, "097": 15, "098": 18,
  "099": 14, "100": 13, "101": 19, "103": 13,
  "105": 17, "106": 18, "107": 14, "110": 15,
  "111": 21, "112": 16, "114": 19, "115": 14,
  "116": 16, "117": 14, "118": 19, "120": 18,
  "122": 15, "125": 13, "128": 17, "129": 14,
  "132": 13, "134": 17, "135": 14, "137": 12,
  "138": 17, "139": 19, "140": 14, "142": 15,
  "143": 19, "144": 13, "149": 16, "150": 20,
  "151": 12, "152": 18, "153": 15,
};
const cropFocus: Partial<Record<string, string>> = {
  "032": "44% 50%", "033": "50% 46%", "036": "48% 50%", "039": "53% 50%",
  "040": "67% 50%", "042": "57% 50%", "043": "50% 58%", "044": "50% 46%",
  "046": "53% 50%", "048": "54% 50%", "049": "50% 46%", "053": "50% 43%",
  "061": "57% 50%", "063": "62% 50%", "068": "50% 43%", "074": "58% 50%",
  "079": "63% 50%", "084": "50% 50%", "087": "55% 50%", "088": "53% 50%",
  "094": "60% 50%", "098": "40% 50%", "105": "54% 50%", "106": "55% 50%",
  "114": "59% 50%", "118": "48% 50%", "120": "56% 50%", "129": "50% 54%",
  "139": "57% 50%", "143": "62% 50%", "150": "59% 50%", "152": "59% 50%",
};
const uncroppedFrames = new Set(["111", "138"]);

const highlights: Partial<Record<string, string>> = {
  "032": "전시장 벽에 설치된 원형 그래픽과 IGNITE 캐릭터",
  "033": "전시장 입구 벽면에 나란히 걸린 포스터와 번개 그래픽",
  "034": "벽면에 설치된 IGNITE 로고와 전시 캐릭터",
  "036": "IGNITE 로고가 표시된 전시장 모니터",
  "039": "전시 웹사이트를 볼 수 있는 현장 안내 PC",
  "040": "전시 로고가 인쇄된 티셔츠와 굿즈 진열",
  "111": "검정·노랑 그래픽 패널과 제품이 함께 놓인 전시 부스 전경",
  "138": "프로젝트 설명 패널, 모니터, 전시 모형을 함께 배치한 부스 전경",
};

export function ExhibitionArchive() {
  const cards = photos.map(({ id, width, height }, index) => {
    const file = `${assetDirectory}/${id}`;
    const description = highlights[id] ?? `IGNITE 전시 작품 및 공간 기록 ${index + 1}`;
    return (
      <li key={id} style={{ gridRowEnd: `span ${frameRows[id] ?? 14}` }}>
        <a
          className={styles.exhibitionArchiveLink}
          data-uncropped={uncroppedFrames.has(id) ? true : undefined}
          href={`${file}-full.webp`}
          target="_blank"
          rel="noopener"
          title="고해상도 사진 열기 (새 탭)"
        >
          {/* Pre-encoded WebP candidates are served directly without runtime resizing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={description}
            src={`${file}-800.webp`}
            srcSet={thumbnailWidths.map(size => `${file}-${size}.webp ${size}w`).join(", ")}
            sizes={thumbnailSizes}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: cropFocus[id] }}
          />
          <span className="sr-only"> — 고해상도 사진 열기 (새 탭)</span>
        </a>
      </li>
    );
  });

  return (
    <ExhibitionArchiveReveal className={`${styles.archiveGrid} ${styles.exhibitionArchive}`}>
      {cards}
    </ExhibitionArchiveReveal>
  );
}
