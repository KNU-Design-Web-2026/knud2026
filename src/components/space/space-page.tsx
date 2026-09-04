import { SiteFooter } from "@/components/layout/site-footer";
import { archiveColumns } from "./space-data";
import { SpaceMap } from "./space-map";
import styles from "./space-page.module.css";

export function SpacePage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.mapSection} aria-labelledby="space-map-title">
          <div className={styles.heading}>
            <h1 id="space-map-title">SPACE 9 MAP</h1>
            <p>이름에 커서를 올려 작품 정보를 확인해보세요!</p>
          </div>
          <SpaceMap />
        </section>
        <section className={styles.archive} aria-labelledby="space-archive-title">
          <div className={`${styles.heading} ${styles.archiveHeading}`}>
            <h2 id="space-archive-title">Archive</h2>
            <p>Ignite의 모든 순간을 담은 아카이브 입니다.</p>
          </div>
          <div className={styles.archiveGrid} aria-label="전시 아카이브 사진 준비 중">
            {archiveColumns.map((heights, column) => (
              <div className={styles.archiveColumn} key={column} aria-hidden="true">
                {heights.map((height, index) => (
                  <div className={styles.archivePanel} style={{ aspectRatio: `${column === 1 ? 514 : 515} / ${height}` }} key={index} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
