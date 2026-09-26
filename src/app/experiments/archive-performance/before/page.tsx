/* eslint-disable @next/next/no-img-element -- This route intentionally measures unoptimized native images. */
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import styles from "./page.module.css";

type ArchiveFixture = {
  id: string;
  src: string;
  width: number;
  height: number;
  bytes: number;
};

type ArchiveFixtureManifest = {
  totalBytes: number;
  images: ArchiveFixture[];
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive Before 성능 실험",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Archive 이미지 최적화를 적용하기 전의 의도적인 최악 조건입니다.
 * 실제 서비스 구현으로 복사하지 않고 After 실험과 수치 비교에만 사용합니다.
 */

async function readFixtureManifest(): Promise<ArchiveFixtureManifest | null> {
  const manifestPath = path.join(
    process.cwd(),
    "public/performance-fixtures/archive-before/manifest.json",
  );

  try {
    return JSON.parse(await readFile(manifestPath, "utf8")) as ArchiveFixtureManifest;
  } catch {
    return null;
  }
}

function formatMebibytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

export default async function ArchivePerformanceBeforePage() {
  const manifest = await readFixtureManifest();

  if (!manifest) {
    return (
      <div className={styles.page}>
        <div className={styles.missing} role="status">
          <strong>로컬 Archive 성능 fixture가 없습니다.</strong>
          <code>pnpm perf:archive:before</code>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Performance baseline · Before</p>
          <h1>40 original archive images</h1>
          <p className={styles.description}>
            4K급 JPEG 40장을 최적화와 점진 로딩 없이 한 번에 요청하는 기준 화면입니다. 실제 Archive 구현에는 사용하지 않습니다.
          </p>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Images</dt>
            <dd>{manifest.images.length}</dd>
          </div>
          <div>
            <dt>Original payload</dt>
            <dd>{formatMebibytes(manifest.totalBytes)}</dd>
          </div>
        </dl>
      </header>
      <section className={styles.archive} aria-label="Archive Before 원본 이미지 목록" data-archive-variant="before">
        {manifest.images.map((image, index) => (
          <figure className={styles.card} key={image.id}>
            <img
              alt={`Archive 성능 fixture ${index + 1}`}
              decoding="sync"
              height={image.height}
              loading="eager"
              src={image.src}
              width={image.width}
            />
          </figure>
        ))}
      </section>
    </div>
  );
}
