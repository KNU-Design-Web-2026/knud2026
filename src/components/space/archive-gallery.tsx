"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { calculateMasonryLayout, type MasonryLayout } from "./archive-masonry";
import styles from "./space-page.module.css";

export type ArchiveCandidate = {
  width: number;
  src: string;
};

type ArchiveImageBase = {
  id: string;
  width: number;
  height: number;
};

type OptimizedArchiveFixture = ArchiveImageBase & {
  blurDataURL: string;
  sources: {
    avif: ArchiveCandidate[];
    webp: ArchiveCandidate[];
  };
  src?: never;
};

type DirectArchiveImage = ArchiveImageBase & {
  src: string;
  blurDataURL?: never;
  sources?: never;
};

export type ArchiveFixture = OptimizedArchiveFixture | DirectArchiveImage;

const batchSize = 6;
const archiveSizes = "(max-width: 821px) 46vw, (max-width: 1700px) 31vw, 515px";

function createSrcSet(candidates: ArchiveCandidate[]) {
  return candidates.map(candidate => `${candidate.src} ${candidate.width}w`).join(", ");
}

function ArchivePicture({ image, index }: { image: ArchiveFixture; index: number }) {
  if (!image.sources) {
    return (
      // The S3 test intentionally requests the original object without Next.js optimization.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`전시 아카이브 이미지 ${index + 1}`}
        decoding="async"
        height={image.height}
        loading="eager"
        src={image.src}
        width={image.width}
      />
    );
  }

  return (
    <picture className={styles.archivePhotoPicture}>
      <source sizes={archiveSizes} srcSet={createSrcSet(image.sources.avif)} type="image/avif" />
      <source sizes={archiveSizes} srcSet={createSrcSet(image.sources.webp)} type="image/webp" />
      <img
        alt={`Archive 성능 테스트 이미지 ${index + 1}`}
        decoding="async"
        height={image.height}
        loading="eager"
        sizes={archiveSizes}
        src={image.sources.webp.at(-1)?.src}
        srcSet={createSrcSet(image.sources.webp)}
        width={image.width}
      />
    </picture>
  );
}

export function ArchiveGallery({ images }: { images: ArchiveFixture[] }) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const boundaryRef = useRef<HTMLElement>(null);
  const [masonryLayout, setMasonryLayout] = useState<MasonryLayout | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery || !("ResizeObserver" in window)) {
      return;
    }

    let previousWidth = -1;

    const updateLayout = () => {
      const containerWidth = gallery.clientWidth;

      if (containerWidth <= 0 || Math.abs(containerWidth - previousWidth) < 0.5) {
        return;
      }

      previousWidth = containerWidth;
      const computedStyle = getComputedStyle(gallery);
      const columnCount = Number.parseInt(computedStyle.getPropertyValue("--archive-column-count"), 10) || 3;
      const gap = Number.parseFloat(computedStyle.columnGap) || 0;

      setMasonryLayout(calculateMasonryLayout(images, { columnCount, containerWidth, gap }));
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(gallery);

    return () => resizeObserver.disconnect();
  }, [images]);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery || visibleCount > 0) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = globalThis.setTimeout(() => setVisibleCount(images.length), 0);
      return () => globalThis.clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(Math.min(batchSize, images.length));
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(gallery);
    return () => observer.disconnect();
  }, [images.length, visibleCount]);

  useEffect(() => {
    const boundary = boundaryRef.current;

    if (!boundary || visibleCount === 0 || visibleCount >= images.length) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(current => Math.min(current + batchSize, images.length));
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(boundary);
    return () => observer.disconnect();
  }, [images.length, visibleCount]);

  return (
    <div
      className={`${styles.archiveGrid} ${styles.archivePhotoGrid}`}
      aria-label="전시 아카이브 성능 테스트 이미지"
      data-masonry-ready={masonryLayout !== null}
      ref={galleryRef}
      style={masonryLayout ? { height: `${masonryLayout.height}px` } : undefined}
    >
      {images.map((image, index) => {
        const isVisible = index < visibleCount;
        const isBoundary = isVisible && index === visibleCount - 1 && visibleCount < images.length;
        const masonryPosition = masonryLayout?.items[index];

        return (
          <figure
            className={styles.archivePhoto}
            data-loaded={isVisible}
            key={image.id}
            ref={isBoundary ? boundaryRef : undefined}
            style={{
              aspectRatio: `${image.width} / ${image.height}`,
              backgroundImage: isVisible && image.blurDataURL ? `url(${image.blurDataURL})` : undefined,
              ...(masonryPosition ? {
                height: `${masonryPosition.height}px`,
                left: `${masonryPosition.left}px`,
                position: "absolute" as const,
                top: `${masonryPosition.top}px`,
                width: `${masonryPosition.width}px`,
              } : {}),
            }}
          >
            {isVisible ? <ArchivePicture image={image} index={index} /> : <span className={styles.archivePlaceholder} aria-hidden="true" />}
          </figure>
        );
      })}
    </div>
  );
}
