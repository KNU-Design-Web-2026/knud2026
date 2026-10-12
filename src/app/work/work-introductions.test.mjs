import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WORK_INTRODUCTIONS } from "../../data/work-introductions.ts";
import { WORK_DETAILS } from "../../data/work-details.ts";
import { WORK_ITEMS } from "../../data/work-items.ts";
import { WorkDetailPage } from "../../components/work/work-detail-page.tsx";

test("수정완료 5명의 국문·영문 소개는 승인된 복사본의 문장과 줄바꿈을 그대로 유지한다", async () => {
  const approved = JSON.parse(await readFile(new URL("./fixtures/approved-introduction-paragraphs.json", import.meta.url), "utf8"));
  assert.equal(Object.keys(approved).length, 5);
  for (const [artist, copy] of Object.entries(approved)) {
    assert.equal(WORK_INTRODUCTIONS[artist].storyKo, copy.storyKo, `${artist} 국문`);
    assert.equal(WORK_INTRODUCTIONS[artist].storyEn, copy.storyEn, `${artist} 영문`);
  }
  assert.equal(WORK_INTRODUCTIONS["김은별"].storyKo.split("\n\n").length, 2);
  assert.equal(WORK_INTRODUCTIONS["이초원"].storyKo.split("\n\n").length, 3);
  assert.equal(WORK_INTRODUCTIONS["이나경"].storyEn.split("\n").length, 1);
  assert.equal(WORK_INTRODUCTIONS["김민주"].storyEn.split("\n\n\n").length, 3);
});

test("제출된 16개 프로젝트의 국문·영문 소개가 정확한 작가 상세에 연결된다", () => {
  assert.equal(Object.keys(WORK_INTRODUCTIONS).length, 16);
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

test("김서은의 RE:BLOOM 소개는 작품 상세에 국문·영문 4문단으로 연결된다", () => {
  const introduction = WORK_INTRODUCTIONS["김서은"];
  const detail = WORK_DETAILS["4"];
  assert.equal(detail.artistKo, "김서은");
  assert.equal(detail.hasSubmittedIntroduction, true);
  for (const field of ["storyKo", "storyEn"]) {
    assert.equal(detail[field], introduction[field]);
    assert.equal(detail[field].split("\n\n").length, 4);
    assert.doesNotMatch(detail[field], /<br\s*\/?\s*>/i);
    assert.match(detail[field], /RE:BLOOM/);
  }
  assert.match(detail.storyKo, /^우리는 살아가며 다양한 관계를 맺고/);
  assert.match(detail.storyEn, /^As we live, we form various relationships/);
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
