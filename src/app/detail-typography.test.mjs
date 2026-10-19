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

test("프로필 인터뷰 중간 크기는 PC 19px·태블릿 16px·모바일 14px과 질문 굵기를 유지한다", () => {
  const component = readFileSync(new URL("../components/profile/profile-detail-page.tsx", import.meta.url), "utf8");
  assert.match(component, /profile-detail--compact/);
  assert.match(styles, /--profile-reading-interview: 1\.1875rem/);
  assert.match(styles, /\.profile-detail--compact \.profile-detail__interview-item \{[^}]*font-size: var\(--profile-reading-interview\)/);
  assert.match(component, /<h3 className="font-bold">/);
  assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*?--profile-reading-interview: 1rem/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?--profile-reading-interview: 0\.875rem/);
});

test("PC 자기소개 폭만 75%로 넓히고 글자 크기와 작은 화면 전체 폭을 유지한다", () => {
  assert.match(styles, /--profile-reading-body: 1\.375rem/);
  assert.match(styles, /\.profile-detail--compact \.profile-detail__introduction \{[^}]*max-width: 75%;[^}]*overflow-wrap: anywhere;[^}]*word-break: keep-all/);
  assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*?\.profile-detail--compact \.profile-detail__introduction \{[^}]*max-width: 100%/);
  const introductionRule = styles.match(/\.profile-detail--compact \.profile-detail__introduction \{([^}]+)\}/)?.[1];
  assert.doesNotMatch(introductionRule, /(?:^|\n)\s*(?:max-)?height:|line-clamp|hidden|ellipsis|position:/);
});
