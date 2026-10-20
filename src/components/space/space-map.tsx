"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { spaceBooths, mobileSpaceBooths } from "./space-booths";
import { getSpaceWork } from "./space-works";
import styles from "./space-page.module.css";

// Compact touch layouts navigate directly; mouse-driven PC/tablet layouts also preview.
const desktopPreviewQuery = "(min-width: 822px) and (hover: hover) and (pointer: fine)";

export function SpaceMap({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState(0);
  const work = getSpaceWork(spaceBooths[lastActive].artistKo);
  const position = spaceBooths[lastActive];

  function show(index: number) {
    setLastActive(index);
    setActive(index);
  }
  function showDesktopPreview(index: number) {
    if (window.matchMedia(desktopPreviewQuery).matches) show(index);
  }

  return (
    <div className={compact ? styles.compactMap : styles.map} aria-label="SPACE 9 전시 배치도"
      onKeyDown={event => { if (event.key === "Escape") setActive(null); }}
      onPointerLeave={() => setActive(null)}>
      <Image alt="SPACE 9 작가별 부스 배치, 컨셉존과 미디어 & 굿즈존" className={styles.assignedLandscape} src="/assets/figma/space/map-assigned-2026.svg" width={560} height={396} loading="eager" fetchPriority="high" unoptimized />
      {compact && <Image alt="SPACE 9 작가별 세로 부스 배치" className={styles.assignedPortrait} src="/assets/figma/space/map-assigned-mobile-2026.svg" width={384} height={542} loading="eager" fetchPriority="high" unoptimized />}
      {[spaceBooths, ...(compact ? [mobileSpaceBooths] : [])].map((booths, orientation) => (
        <div className={orientation === 0 ? styles.assignedLandscapeLinks : styles.assignedPortraitLinks} key={orientation}>
          {booths.map((booth, index) => {
            const assigned = getSpaceWork(booth.artistKo);
            return <Link href={`/work/${assigned.id}`} prefetch={false} key={booth.artistKo}
              className={styles.assignedBooth}
              style={{
                left: `${booth.x}%`, top: `${booth.y}%`, width: `${booth.width}%`, height: `${booth.height}%`,
                "--name-mask-size": `${10000 / booth.width}% ${10000 / booth.height}%`,
                "--name-mask-position": `${100 * booth.x / (100 - booth.width)}% ${100 * booth.y / (100 - booth.height)}%`,
              } as CSSProperties}
              aria-label={`${assigned.artistKo} ${assigned.title} 작품 정보 보기`}
              aria-expanded={active === index} aria-controls={compact ? "space-project-preview-compact" : "space-project-preview"}
              onPointerEnter={event => { if (event.pointerType === "mouse") showDesktopPreview(index); }}
              onPointerLeave={() => setActive(null)}
              onFocus={() => showDesktopPreview(index)} onBlur={() => setActive(null)}>
              <span className="sr-only">{booth.artistKo}</span>
            </Link>;
          })}
        </div>
      ))}
      <SpaceProjectPreview key={`${work.id}:${work.spaceImageSrc}`} work={work} position={position}
        open={active !== null} compact={compact} />
    </div>
  );
}

function SpaceProjectPreview({ work, position, open, compact }: {
  work: ReturnType<typeof getSpaceWork>;
  position: (typeof spaceBooths)[number];
  open: boolean;
  compact: boolean;
}) {
  // A different work gets a fresh image node and fresh readiness state. A late
  // load from the previous work cannot reveal its image under the next title.
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  return (
    <div id={compact ? "space-project-preview-compact" : "space-project-preview"}
      className={styles.preview} data-open={open} data-image-state={imageState}
      aria-hidden={!open} aria-busy={open && imageState === "loading"}
      role="region" aria-label={`${work.artistKo} 작품 정보`}
      style={{ left: `${position.x > 48 ? position.x - 39 : position.x + 7}%`, top: `${Math.min(position.y + 3, 60)}%` }}>
      <div className={styles.previewContent} data-ready={imageState === "ready"}>
        <Image alt="" className={styles.previewImage} src={work.spaceImageSrc} fill
          loading="eager" sizes="(max-width: 821px) 0px, (max-width: 1350px) 48vw, 637px"
          onLoad={() => setImageState("ready")} onError={() => setImageState("error")} />
        <div className={styles.previewShade} />
        <div className={styles.previewCopy}><p><strong>{work.artistKo}</strong>{work.artistEn}</p><h3>{work.title}</h3></div>
      </div>
      {imageState !== "ready" && <div className={styles.previewStatus} role="status">
        {imageState === "loading" && <span className={styles.previewSpinner} aria-hidden="true" />}
        <span>{imageState === "loading" ? "작품 이미지 불러오는 중" : "이미지를 불러오지 못했습니다."}</span>
      </div>}
    </div>
  );
}
