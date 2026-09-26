/* eslint-disable @next/next/no-img-element -- 4K 원본을 그대로 요청하는 Before 성능 기준 화면입니다. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SiteFooter } from "@/components/layout/site-footer";
import { archiveColumns } from "./space-data";
import { SpaceMap } from "./space-map";
import { CompactSpaceMap } from "./compact-space-map";
import styles from "./space-page.module.css";

type ArchiveFixture = {
  id: string;
  src: string;
  width: number;
  height: number;
};

type ArchiveFixtureManifest = {
  images: ArchiveFixture[];
};

function readArchiveFixtures() {
  try {
    const manifestPath = join(process.cwd(), "public/performance-fixtures/archive-before/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ArchiveFixtureManifest;
    return manifest.images;
  } catch {
    return [];
  }
}

export function SpacePage() {
  const archiveFixtures = readArchiveFixtures();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.mapSection} aria-labelledby="space-map-title">
          <div className={styles.heading}>
            <h1 id="space-map-title">SPACE 9 MAP</h1>
            <p>
              <span className={styles.desktopInstruction}>이름에 커서를 올려 작품 정보를 확인해보세요!</span>
              <span className={styles.tabletInstruction}>이름을 클릭하여 작품 정보를 확인해보세요!</span>
              <span className={styles.compactInstruction}>이름을 터치하여 작품 정보를 확인해보세요!</span>
            </p>
          </div>
          <SpaceMap />
          <CompactSpaceMap />
        </section>
        <section className={styles.archive} aria-labelledby="space-archive-title">
          <div className={`${styles.heading} ${styles.archiveHeading}`}>
            <h2 id="space-archive-title">Archive</h2>
            <p>IGNITE의 모든 순간을 담은 아카이브입니다.</p>
          </div>
          {archiveFixtures.length > 0 ? (
            <div className={`${styles.archiveGrid} ${styles.archivePhotoGrid}`} aria-label="전시 아카이브 성능 테스트 이미지">
              {archiveFixtures.map((image, index) => (
                <figure className={styles.archivePhoto} key={image.id}>
                  <img
                    alt={`Archive 성능 테스트 이미지 ${index + 1}`}
                    decoding="sync"
                    height={image.height}
                    loading="eager"
                    src={image.src}
                    width={image.width}
                  />
                </figure>
              ))}
            </div>
          ) : (
            <div className={styles.archiveGrid} aria-label="전시 아카이브 사진 준비 중">
              {archiveColumns.map((heights, column) => (
                <div className={styles.archiveColumn} key={column} aria-hidden="true">
                  {heights.map((height, index) => (
                    <div className={styles.archivePanel} style={{ aspectRatio: `${column === 1 ? 514 : 515} / ${height}` }} key={index} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
