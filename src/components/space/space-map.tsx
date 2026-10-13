"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
      <Image alt="SPACE 9 작가별 부스 배치, 컨셉존과 미디어 & 굿즈존" className={styles.assignedLandscape} src="/assets/figma/space/map-assigned-2026.png" width={1626} height={1150} loading="eager" fetchPriority="high" unoptimized />
      {compact && <Image alt="SPACE 9 작가별 세로 부스 배치" className={styles.assignedPortrait} src="/assets/figma/space/map-assigned-mobile-2026.png" width={384} height={542} loading="eager" fetchPriority="high" unoptimized />}
      {[spaceBooths, ...(compact ? [mobileSpaceBooths] : [])].map((booths, orientation) => (
        <div className={orientation === 0 ? styles.assignedLandscapeLinks : styles.assignedPortraitLinks} key={orientation}>
          {booths.map((booth, index) => {
            const assigned = getSpaceWork(booth.artistKo);
            return <Link href={`/work/${assigned.id}`} prefetch={false} key={booth.artistKo}
              className={styles.assignedBooth}
              style={{ left: `${booth.x}%`, top: `${booth.y}%`, width: `${booth.width}%`, height: `${booth.height}%` }}
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
      <div id={compact ? "space-project-preview-compact" : "space-project-preview"} className={styles.preview} data-open={active !== null}
        aria-hidden={active === null} role="region" aria-label={`${work.artistKo} 작품 정보`}
        style={{ left: `${position.x > 48 ? position.x - 39 : position.x + 7}%`, top: `${Math.min(position.y + 3, 60)}%` }}>
        <Image alt="" className={styles.previewImage} src={work.spaceImageSrc} fill sizes="(max-width: 821px) 0px, (max-width: 1350px) 48vw, 785px" />
        <div className={styles.previewShade} />
        <div className={styles.previewCopy}><p><strong>{work.artistKo}</strong>{work.artistEn}</p><h3>{work.title}</h3></div>
      </div>
    </div>
  );
}
