"use client";

import Image from "next/image";
import { useState } from "react";
import { spaceMapSize, spacePositions } from "./space-data";
import { getSpaceWork } from "./space-works";
import styles from "./space-page.module.css";

const positions = [...spacePositions, { x: 758.855, y: 553.318, vertical: true, rotation: undefined }];

export function SpaceMap() {
  const [active, setActive] = useState<number | null>(null);
  // Retain the last card during its exit animation.
  const [lastActive, setLastActive] = useState(0);
  const work = getSpaceWork(lastActive);
  const position = positions[lastActive];
  const x = position.x / spaceMapSize.width * 100;
  const y = position.y / spaceMapSize.height * 100;

  function show(index: number) {
    setLastActive(index);
    setActive(index);
  }

  return (
    <div className={styles.map} aria-label="SPACE 9 전시 배치도"
      onKeyDown={(event) => { if (event.key === "Escape") setActive(null); }}
      onPointerLeave={() => setActive(null)}>
      <Image alt="" className={styles.outline} src="/assets/figma/space/map-outline.svg" width={1273.71} height={716.31} priority />
      <Image alt="" className={styles.island} src="/assets/figma/space/map-island.svg" width={319.44} height={287.12} priority />
      <Image alt="" className={styles.entry} src="/assets/figma/space/map-entry.svg" width={43} height={85} priority />
      {positions.map((item, index) => {
        const assigned = getSpaceWork(index);
        return <button type="button" key={index}
          className={`${styles.name} ${styles.artist} ${item.vertical ? styles.vertical : ""} ${item.rotation ? styles.diagonal : ""}`}
          style={{ left: `${item.x / spaceMapSize.width * 100}%`, top: `${item.y / spaceMapSize.height * 100}%` }}
          aria-label={`${assigned.artistKo} ${assigned.title} 미리보기 (임시 배치)`}
          aria-expanded={active === index} aria-controls="space-project-preview"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") show(index); }}
          onPointerLeave={() => setActive(null)}
          onFocus={() => show(index)} onBlur={() => setActive(null)} onClick={() => show(index)}>
          {item.vertical ? [..."홍길동"].map((letter, i) => <span key={i}>{letter}</span>) : <span style={item.rotation ? { transform: `rotate(${item.rotation}deg)` } : undefined}>홍길동</span>}
        </button>;
      })}
      <div id="space-project-preview" className={styles.preview} data-open={active !== null}
        aria-hidden={active === null} role="region" aria-label={`${work.artistKo} 작품 정보`}
        style={{ left: `${x > 48 ? x - 50.5 : x + 8}%`, top: `${Math.min(y, 65)}%` }}>
        <Image alt="" src={work.imageSrc} fill unoptimized className={styles.previewImage} />
        <div className={styles.previewShade} />
        <div className={styles.previewCopy}>
          <p><strong>{work.artistKo}</strong><span>{work.artistEn}</span></p>
          <h3>{work.title}</h3>
        </div>
      </div>
    </div>
  );
}
