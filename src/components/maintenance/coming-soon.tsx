import { KnudLogo } from "@/components/layout/knud-logo";
import styles from "./coming-soon.module.css";

export function ComingSoon() {
  return (
    <section className={styles.page} aria-labelledby="coming-soon-title">
      <div className={styles.content}>
        <div className={styles.logo} role="img" aria-label="IGNITE">
          <KnudLogo eager />
        </div>
        <div className={styles.information}>
          <h1 id="coming-soon-title" className={styles.title}>
            제42회 경북대학교 디자인학과 졸업전시회
          </h1>
          <p className={styles.date}>2026.10.20(화) — 10.30(금)</p>
          <p className={styles.hours}>09:00 — 18:00</p>
          <p className={styles.venue}>경북대학교 SPACE 9</p>
          <p className={styles.status}>사이트는 현재 준비 중입니다.</p>
        </div>
      </div>
    </section>
  );
}
