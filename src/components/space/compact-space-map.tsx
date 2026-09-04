import Image from "next/image";
import Link from "next/link";
import { getSpaceWork, mobileWorkPositions, tabletWorkPositions } from "./space-works";
import styles from "./space-page.module.css";

// Coordinates from the 600px frame; the mobile frame has separately oriented labels.
const tabletNames = [
  [72.244,8.665],[74.244,98.665],[176.244,98.665],[267.244,98.665],
  [341.244,98.665],[74.244,154.665],[83.244,281.665],[147.244,281.665],
  [211.244,281.665],[275.244,281.665],[30.22,234.665,45],
  [14.244,94.665,90],[365.244,43.665,90],[169.244,204.665,90],
  [328.244,239.665,90],[14.244,160.665,90],[25.244,29.665,-45],
  [136.244,8.665],[200.244,8.665],[264.244,8.665],[328.244,8.665],
];
const mobileNames = [
  [14.09,31.09,73.49,65.51,0],[91.28,42.61,4.36,49.45,90],
  [91.28,54.33,4.36,37.73,90],[91.28,66.05,4.36,26.02,90],
  [91.28,77.2,4.36,14.87,90],[50,78.52,45.64,13.54,90],
  [32.55,78.52,63.09,13.54,90],[32.55,61.51,63.09,30.55,90],
  [32.55,43.75,63.09,48.32,90],[32.55,31.84,63.09,60.22,90],
  [3.36,78.52,92.28,13.54,90],[3.36,67.18,92.28,24.88,90],
  [3.36,55.84,92.28,36.22,90],[3.36,44.5,92.28,47.56,90],
  [3.36,33.16,92.28,58.9,90],[52.35,94.58,35.23,2.02,0],
  [77.52,37.89,10.07,58.71,0],[66.78,66.8,20.81,29.8,0],
  [74.2,87.99,12.75,4.66,-45],[9.1,87.99,77.85,4.66,45],
  [30.54,94.58,57.05,2.02,0],
];

export function CompactSpaceMap() {
  return <div className={styles.compactMap} aria-label="SPACE 9 전시 배치도">
    <div className={styles.mapDrawing}>
      <Image alt="" className={styles.outline} src="/assets/figma/space/map-outline.svg" width={1273.71} height={716.31} />
      <Image alt="" className={styles.island} src="/assets/figma/space/map-island.svg" width={319.44} height={287.12} />
      <Image alt="" className={styles.entry} src="/assets/figma/space/map-entry.svg" width={43} height={85} />
    </div>
    <div className={styles.tabletNames}>
      {tabletNames.map(([x,y,rotation], index) => {
        const work = getSpaceWork(tabletWorkPositions[index]);
        return <Link href={`/work/${work.id}`} prefetch={false} aria-label={`${work.artistKo} ${work.title} 보기 (임시 배치)`} key={index} className={`${styles.compactName} ${styles.workLink} ${rotation && rotation!==90 ? styles.compactDiagonal : ""}`} style={{left:`${x/552.48749*100}%`,top:`${y/311.2796*100}%`}}><MapName rotation={rotation} /></Link>;
      })}
    </div>
    <div className={styles.mobileNames}>
      {mobileNames.map(([top,right,bottom,left,rotation], index) => {
        const work = getSpaceWork(mobileWorkPositions[index]);
        return <Link href={`/work/${work.id}`} prefetch={false} aria-label={`${work.artistKo} ${work.title} 보기 (임시 배치)`} key={index} className={`${styles.mobileNameBox} ${styles.workLink}`} style={{left:`${bottom}%`,top:`${left}%`,width:`${100-top-bottom}%`,height:`${100-left-right}%`}}><MapName rotation={rotation} /></Link>;
      })}
    </div>
  </div>;
}

function MapName({ rotation }: { rotation?: number }) {
  return rotation === 90
    ? <span className={styles.compactVertical}>{[..."홍길동"].map((letter,index) => <span key={index}>{letter}</span>)}</span>
    : <span style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}>홍길동</span>;
}
