"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type CSSProperties, type RefObject } from "react";
import { spaceBooths, mobileSpaceBooths } from "./space-booths";
import { getSpaceWork } from "./space-works";
import styles from "./space-page.module.css";
import { initialPreviewLoad, previewLoadReducer } from "./preview-load-state";

// Compact touch layouts navigate directly; mouse-driven PC/tablet layouts also preview.
const desktopPreviewQuery = "(min-width: 822px) and (hover: hover) and (pointer: fine)";

export function SpaceMap({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<HTMLAnchorElement | null>(null);
  const work = getSpaceWork(spaceBooths[lastActive].artistKo);
  const position = spaceBooths[lastActive];

  function leaveBooth(target: EventTarget | null) {
    if (target instanceof Node && previewRef.current?.contains(target)) return;
    // Keep failure feedback available while crossing the map to its retry
    // control. The card itself must never intercept the underlying links.
    if (previewRef.current?.dataset.imageState !== "error") setActive(null);
  }
  function show(index: number, owner: HTMLAnchorElement) {
    ownerRef.current = owner;
    setLastActive(index);
    setActive(index);
  }
  function showDesktopPreview(index: number, owner: HTMLAnchorElement) {
    if (window.matchMedia(desktopPreviewQuery).matches) show(index, owner);
  }

  return (
    <div className={compact ? styles.compactMap : styles.map} aria-label="SPACE 9 전시 배치도"
      onKeyDown={event => {
        if (event.key === "Escape") { ownerRef.current?.focus(); setActive(null); }
        const retry = previewRef.current?.querySelector("button");
        if (event.key === "Tab" && !event.shiftKey && active !== null && event.target === ownerRef.current && retry) {
          event.preventDefault(); retry.focus();
        }
      }}
      onBlur={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setActive(null); }}
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
              onPointerEnter={event => { if (event.pointerType === "mouse") showDesktopPreview(index, event.currentTarget); }}
              onPointerLeave={event => leaveBooth(event.relatedTarget)}
              onFocus={event => showDesktopPreview(index, event.currentTarget)}>
              <span className="sr-only">{booth.artistKo}</span>
            </Link>;
          })}
        </div>
      ))}
      <SpaceProjectPreview key={`${work.id}:${work.spaceImageSrc}`} work={work} position={position}
        open={active !== null} compact={compact} previewRef={previewRef} ownerRef={ownerRef}
        onPointerLeave={target => {
          if (target === ownerRef.current || (target instanceof Node && ownerRef.current?.contains(target))) return;
          if (document.activeElement !== ownerRef.current) setActive(null);
        }} />
    </div>
  );
}

function SpaceProjectPreview({ work, position, open, compact, previewRef, ownerRef, onPointerLeave }: {
  work: ReturnType<typeof getSpaceWork>;
  position: (typeof spaceBooths)[number];
  open: boolean;
  compact: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
  ownerRef: RefObject<HTMLAnchorElement | null>;
  onPointerLeave: (target: EventTarget | null) => void;
}) {
  // A different work gets a fresh image node and fresh readiness state. A late
  // load from the previous work cannot reveal its image under the next title.
  const [load, dispatch] = useReducer(previewLoadReducer, initialPreviewLoad);
  const imageState = load.status;
  useEffect(() => {
    if (!open || imageState !== "loading") return;
    const timer = setTimeout(() => dispatch({ type: "delayed", attempt: load.attempt }), 2_000);
    return () => clearTimeout(timer);
  }, [open, imageState, load.attempt]);
  return (
    <div ref={previewRef} id={compact ? "space-project-preview-compact" : "space-project-preview"}
      className={styles.preview} data-open={open} data-image-state={imageState}
      onPointerLeave={event => onPointerLeave(event.relatedTarget)}
      aria-hidden={!open} aria-busy={open && imageState === "loading"}
      role="region" aria-label={`${work.artistKo} 작품 정보`}
      style={{ left: `${position.x > 48 ? position.x - 39 : position.x + 7}%`, top: `${Math.min(position.y + 3, 60)}%` }}>
      <div className={styles.previewContent} style={{ backgroundImage: work.spacePreviewDataURL ? `url("${work.spacePreviewDataURL}")` : undefined }}>
        <Image key={load.attempt} alt="" className={styles.previewImage} data-ready={imageState === "ready"} src={work.spaceImageSrc} fill
          loading="eager" sizes="(max-width: 821px) 0px, (max-width: 1350px) 48vw, (min-width: 1921px) 33.17vw, 637px"
          onLoad={event => { if (event.currentTarget.naturalWidth > 0) dispatch({ type: "loaded", attempt: load.attempt }); }}
          onError={() => dispatch({ type: "failed", attempt: load.attempt })} />
        <div className={styles.previewShade} />
        <div className={styles.previewCopy}><p><strong>{work.artistKo}</strong>{work.artistEn}</p><h3>{work.title}</h3></div>
      </div>
      {open && (imageState === "error" || load.delayed) && <div className={styles.previewStatus}>
        <span role="status">{imageState === "loading" ? "고화질 이미지 불러오는 중" : "이미지 로딩 실패"}</span>
        {imageState === "error" && <button type="button" onClick={() => {
          // Restore focus before removing the currently focused retry button.
          ownerRef.current?.focus();
          dispatch({ type: "retry" });
        }}
          onKeyDown={event => {
            if (event.key !== "Tab") return;
            const target = event.shiftKey ? ownerRef.current : ownerRef.current?.nextElementSibling;
            if (target instanceof HTMLAnchorElement) { event.preventDefault(); target.focus(); }
          }}>다시 불러오기</button>}
      </div>}
    </div>
  );
}
