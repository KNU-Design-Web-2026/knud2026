"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { spaceMapSize, spacePositions } from "./space-data";
import styles from "./space-page.module.css";

export function SpaceMap() {
  const [open, setOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !mapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <div
      className={styles.map}
      ref={mapRef}
      aria-label="SPACE 9 전시 배치도"
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}
    >
      <Image alt="" className={styles.outline} src="/assets/figma/space/map-outline.svg" width={1273.71} height={716.31} priority />
      <Image alt="" className={styles.island} src="/assets/figma/space/map-island.svg" width={319.44} height={287.12} priority />
      <Image alt="" className={styles.entry} src="/assets/figma/space/map-entry.svg" width={43} height={85} priority />
      {spacePositions.map((position, index) => (
        <span
          className={`${styles.name} ${position.vertical ? styles.vertical : ""} ${position.rotation ? styles.diagonal : ""}`}
          key={index}
          style={{
            left: `${position.x / spaceMapSize.width * 100}%`,
            top: `${position.y / spaceMapSize.height * 100}%`,
          }}
        >{position.vertical ? [..."홍길동"].map((letter, index) => <span key={index}>{letter}</span>) : <span style={position.rotation ? { transform: `rotate(${position.rotation}deg)` } : undefined}>홍길동</span>}</span>
      ))}
      <button
        className={`${styles.name} ${styles.vertical} ${styles.artist}`}
        aria-expanded={open}
        aria-controls="space-project-preview"
        aria-label="이서윤 작품 정보 보기"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
      >{[..."이서윤"].map((letter, index) => <span key={index}>{letter}</span>)}</button>
      <div id="space-project-preview" className={styles.preview} hidden={!open} role="region" aria-label="이서윤 작품 정보">
        <Image alt="" src="/assets/figma/space/project-preview.png" fill unoptimized className={styles.previewImage} />
        <div className={styles.previewShade} />
        <div className={styles.previewCopy}>
          <p><strong>이서윤</strong><span>Seoyun Lee</span></p>
          <h3>PROJECT NAME</h3>
        </div>
      </div>
    </div>
  );
}
