import { SiteFooter } from "@/components/layout/site-footer";
import { ArchiveGallery } from "./archive-gallery";
import { s3ArchiveImages } from "./space-data";
import { SpaceMap } from "./space-map";
import { CompactSpaceMap } from "./compact-space-map";
import styles from "./space-page.module.css";

export function SpacePage() {
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
          <ArchiveGallery images={s3ArchiveImages} />
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
