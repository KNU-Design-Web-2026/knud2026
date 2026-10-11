import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WORK_INTRODUCTIONS } from "../../data/work-introductions.ts";
import { WORK_DETAILS } from "../../data/work-details.ts";
import { WORK_ITEMS } from "../../data/work-items.ts";
import { WorkDetailPage } from "../../components/work/work-detail-page.tsx";

test("제출된 15개 프로젝트의 국문·영문 소개가 정확한 작가 상세에 연결된다", () => {
  assert.equal(Object.keys(WORK_INTRODUCTIONS).length, 15);
  for (const [artist, introduction] of Object.entries(WORK_INTRODUCTIONS)) {
    const item = WORK_ITEMS.find((work) => work.artistKo === artist);
    assert.ok(item, artist);
    const detail = WORK_DETAILS[String(item.id)];
    assert.equal(detail.storyKo, introduction.storyKo);
    assert.equal(detail.storyEn, introduction.storyEn);
    assert.ok(detail.storyKo.length > 0);
    assert.ok(detail.storyEn.length > 0);
    assert.equal(detail.title, item.title);
    assert.notEqual(detail.title, "작품이름");
    const html = renderToStaticMarkup(React.createElement(WorkDetailPage, { detail }));
    assert.match(html, /aria-label="프로젝트 소개"/);
    assert.match(html, /lang="ko"/);
    assert.match(html, /lang="en"/);
    assert.doesNotMatch(html, /잊힌 이들의 기억|PROJECT NAME/);
  }
});

test("김연수 소개는 후속 수정본의 문단 구분을 사용한다", () => {
  const introduction = WORK_INTRODUCTIONS["김연수"];
  assert.equal(introduction.submittedAt, "2026. 10. 5 오후 6:57:44");
  assert.match(introduction.storyKo, /\n\n이를 실천할 방법/);
  assert.match(introduction.storyEn, /\n\nTo explore/);
});

test("공동 작가 소개는 공동 작품 하나에 연결하고 미제출 소개는 덮어쓰지 않는다", () => {
  assert.match(WORK_DETAILS["9"].storyKo, /Project Green/);
  assert.equal(WORK_DETAILS["9"].artistKo, "박규리 & 이다혜");
  assert.equal(WORK_INTRODUCTIONS["김가연"], undefined);
  assert.match(WORK_DETAILS["2"].storyKo, /잊힌 이들의 기억/);
});

test("작품명에 들어 있던 제출용 표기 메모는 카드와 상세 제목에서 제외한다", () => {
  assert.equal(WORK_ITEMS.find((item) => item.artistKo === "양혜연").title, "MOOEE");
  assert.equal(WORK_DETAILS["11"].title, "MOOEE");
});
