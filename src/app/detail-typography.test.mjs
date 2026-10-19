import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

test("작품 설명은 PC 20px과 여유 있는 행간을 사용하고 모바일 16px은 유지한다", () => {
  const body = styles.match(/\.work-detail__story p \{([^}]+)\}/)?.[1];
  assert.match(body, /font-size: 1\.25rem/);
  assert.match(body, /line-height: 1\.5/);
  assert.match(body, /text-align: start/);
  assert.match(styles, /@media \(max-width: 63\.75rem\)[\s\S]*?\.work-detail__story p \{\s*font-size: 1\.125rem/);
  assert.match(styles, /@media \(max-width: 37\.5rem\)[\s\S]*?\.work-detail__story p \{\s*font-size: 1rem/);
});

test("인터뷰는 PC 20px·태블릿 16px·모바일 14px을 제공하고 질문 굵기를 유지한다", () => {
  const component = readFileSync(new URL("../components/profile/profile-detail-page.tsx", import.meta.url), "utf8");
  assert.match(component, /profile-detail__interview-item[^"\n]*text-\[1\.25rem\] leading-\[1\.5\]/);
  assert.match(component, /<h3 className="font-bold">/);
  assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*?\.profile-detail__interview-item \{[^}]*font-size: 1rem/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?\.profile-detail__interview-item \{[^}]*font-size: 0\.875rem/);
});
