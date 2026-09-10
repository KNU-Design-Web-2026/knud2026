import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteCursorPath = new URL("../layout/site-cursor.tsx", import.meta.url);
const sprayCanvasPath = new URL("./spray-canvas.tsx", import.meta.url);
const heroMotionPath = new URL("./hero-motion.tsx", import.meta.url);
const heroMotionStylesPath = new URL("./hero-motion.css", import.meta.url);
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

  assert.match(styles, /@media \(max-width: 37\.5rem\) \{[\s\S]*?\.main-hero \{[\s\S]*?background: #001a27;/);
});
