import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileCard } from "../../components/profile/profile-card.tsx";
import { ProfileDetailPage } from "../../components/profile/profile-detail-page.tsx";
import { PROFILE_DETAILS } from "../../data/profile-details.ts";
import { PROFILE_MEMBERS } from "../../data/profile-members.ts";

test("모든 프로필 카드는 같은 사람의 상세 페이지와 사진으로 이어진다", () => {
  assert.equal(PROFILE_MEMBERS.length, 20);
  assert.equal(Object.keys(PROFILE_DETAILS).length, 20);

  for (const member of PROFILE_MEMBERS) {
    const detail = PROFILE_DETAILS[String(member.id)];
    assert.ok(detail, `${member.nameKo}의 상세 데이터가 없습니다.`);
    assert.equal(detail.nameKo, member.nameKo);
    assert.equal(detail.nameEn, member.nameEn);
    assert.equal(detail.portraitSrc, member.imageSrc);
    assert.ok(detail.projectName);

    const card = renderToStaticMarkup(React.createElement(ProfileCard, { member }));
    assert.match(card, new RegExp(`href="/profile/${member.id}"`));
  }
});

test("시트의 실제 소개와 인터뷰가 ID에 맞게 상세 페이지에 표시된다", () => {
  const detail = PROFILE_DETAILS["1"];
  assert.equal(detail.nameKo, "공예원");
  assert.equal(detail.projectName, "BEOSEOT CLUB");
  assert.match(detail.introduction, /^새로운 것을 좋아합니다/);
  assert.match(detail.interview[0].answer, /^저를 가장 잘 움직이게 하는 건/);

  const html = renderToStaticMarkup(React.createElement(ProfileDetailPage, { detail }));
  assert.match(html, /공예원 프로필 이미지/);
  assert.match(html, /BEOSEOT CLUB/);
  assert.doesNotMatch(html, /PROJECT NAME/);
});

test("내용이 비어 있는 김서은 상세 페이지에는 허구의 소개·인터뷰 대신 준비 중 안내가 보인다", () => {
  const detail = PROFILE_DETAILS["4"];
  assert.equal(detail.nameKo, "김서은");
  assert.equal(detail.projectName, "REBLOOM");
  assert.equal(detail.introduction, null);
  assert.deepEqual(detail.interview, []);

  const html = renderToStaticMarkup(React.createElement(ProfileDetailPage, { detail }));
  assert.match(html, /소개 준비 중/);
  assert.match(html, /인터뷰 준비 중/);
  assert.doesNotMatch(html, /브랜딩과 편집 디자인을 바탕으로/);
});

test("시트의 긴 문장은 글자 수 제한 때문에 잘리지 않는다", () => {
  assert.ok(PROFILE_DETAILS["5"].interview[1].answer.length > 200);
});

test("20개 상세 경로를 빌드 시 미리 생성한다", async () => {
  const route = await import("./[id]/page.tsx");
  assert.equal(typeof route.generateStaticParams, "function");
  assert.deepEqual(route.generateStaticParams(),
    PROFILE_MEMBERS.map(({ id }) => ({ id: String(id) })));
});
