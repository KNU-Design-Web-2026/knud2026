import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteCursorPath = new URL("../layout/site-cursor.tsx", import.meta.url);
const sprayCanvasPath = new URL("./spray-canvas.tsx", import.meta.url);
const heroMotionPath = new URL("./hero-motion.tsx", import.meta.url);
const heroMotionStylesPath = new URL("./hero-motion.css", import.meta.url);
const heroGeneratorPath = new URL("../../../scripts/generate-hero-motion.py", import.meta.url);
const stylesPath = new URL("../../styles/globals.css", import.meta.url);

test("일반 사이트 커서는 34px × 40.33px 규격을 사용한다", () => {
  const cursor = readFileSync(siteCursorPath, "utf8");

  assert.match(cursor, /h-\[40\.33px\] w-\[34px\]/);
  assert.match(cursor, /sizes="34px"/);
});

test("히어로 모션은 일시정지 UI 없이 화면 노출 상태에 따라 재생된다", () => {
  const component = readFileSync(heroMotionPath, "utf8");
  const styles = readFileSync(heroMotionStylesPath, "utf8");

  assert.doesNotMatch(component, /hero-motion-toggle|모션 멈춤|모션 재생|data-paused/);
  assert.doesNotMatch(styles, /hero-motion-toggle|data-paused/);
  assert.match(styles, /\.hero-motion\[data-running="true"\] \.hero-scene \* \{ animation-play-state: running; \}/);
});

test("사자의 눈은 긴 정지 뒤 두 번 분명하게 깜빡인다", () => {
  const styles = readFileSync(heroMotionStylesPath, "utf8");

  assert.match(styles, /\.hero-eyelid[\s\S]*animation: hero-eye-blink 5\.6s/);
  assert.match(styles, /61\.2%, 62\.6% \{ transform: scaleY\(1\); \}/);
  assert.match(styles, /67%, 68\.2% \{ transform: scaleY\(1\); \}/);
});

test("사자와 스프레이는 폭발 타이밍에 반동하고 모바일에서는 이동량을 줄인다", () => {
  const generator = readFileSync(heroGeneratorPath, "utf8");
  const styles = readFileSync(heroMotionStylesPath, "utf8");

  assert.match(generator, /by_id\['Group_27'\]\.set\('class', 'hero-spray'\)/);
  assert.match(styles, /\.hero-lion[\s\S]*animation: hero-lion-response var\(--hero-cycle\)/);
  assert.match(styles, /\.hero-spray[\s\S]*animation: hero-spray-response var\(--hero-cycle\)/);
  assert.match(styles, /@keyframes hero-lion-response/);
  assert.match(styles, /@keyframes hero-spray-response/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*--lion-recoil: 2px;[\s\S]*--spray-recoil: 2\.5px;/);
});

test("스프레이 색상은 KNUD 팔레트의 주황·파랑을 사용하고 연두를 제외한다", () => {
  const spray = readFileSync(sprayCanvasPath, "utf8");

  assert.match(spray, /#FD9519/);
  assert.match(spray, /#41C9F9/);
  assert.doesNotMatch(spray, /#B6EE57/);
});

test("1020px 이상 메인 프레임의 하단 배경이 이미지 색과 이어진다", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(styles, /@media \(min-width: 63\.8125rem\) and \(max-width: 84\.375rem\) \{[\s\S]*?\.main-hero \{[\s\S]*?background: #011a26;/);
  assert.match(styles, /@media \(min-width: 84\.4375rem\) \{[\s\S]*?\.main-hero \{[\s\S]*?background: #011b27;/);
});

test("600px 이하 메인 프레임의 하단 배경은 모바일 SVG 끝 색과 이어진다", () => {
  const styles = readFileSync(stylesPath, "utf8");

  assert.match(styles, /@media \(max-width: 1020px\) \{[\s\S]*?\.main-hero \{[\s\S]*?background: #001a27;/);
});
