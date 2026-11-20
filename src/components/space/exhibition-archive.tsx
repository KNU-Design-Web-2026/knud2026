import photos from "@/data/exhibition-archive.json";

import styles from "./space-page.module.css";

const assetDirectory = "/assets/archive-2026";
const thumbnailWidths = [480, 800, 1280];
const thumbnailSizes = "(max-width: 821px) 46vw, (max-width: 1700px) 31vw, (max-width: 1920px) 515px, 27.5vw";

// The entrance sequence is composed photo by photo. The frame crops only the
// listing; the high-resolution link still opens the whole photograph.
const openingFrames: Partial<Record<string, { rows: number; focus: string }>> = {
  "032": { rows: 51, focus: "44% 50%" },
  "033": { rows: 37, focus: "50% 46%" },
  "034": { rows: 50, focus: "50% 50%" },
  "036": { rows: 52, focus: "48% 50%" },
  "039": { rows: 48, focus: "53% 50%" },
  "040": { rows: 57, focus: "67% 50%" },
  "042": { rows: 47, focus: "57% 50%" },
  "043": { rows: 37, focus: "50% 58%" },
  "044": { rows: 39, focus: "50% 46%" },
  "046": { rows: 48, focus: "53% 50%" },
  "048": { rows: 50, focus: "54% 50%" },
  "049": { rows: 39, focus: "50% 46%" },
};
const openingPhotoCount = Object.keys(openingFrames).length;

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
    const frame = openingFrames[id];

    return (
      <li key={id} style={frame ? { gridRowEnd: `span ${frame.rows}` } : undefined}>
        <a
          className={styles.exhibitionArchiveLink}
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
            style={frame ? { objectPosition: frame.focus } : undefined}
          />
          <span className="sr-only"> — 고해상도 사진 열기 (새 탭)</span>
        </a>
      </li>
    );
  });

  return (
    <>
      <ul className={`${styles.archiveGrid} ${styles.exhibitionArchive} ${styles.exhibitionArchiveOpening}`}>
        {cards.slice(0, openingPhotoCount)}
      </ul>
      <ul className={`${styles.archiveGrid} ${styles.exhibitionArchive}`}>
        {cards.slice(openingPhotoCount)}
      </ul>
    </>
  );
}
