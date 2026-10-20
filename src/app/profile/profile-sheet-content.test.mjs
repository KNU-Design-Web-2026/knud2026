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

test("김서은 상세 페이지에 제출된 소개·인터뷰와 최신 연락처가 표시된다", () => {
  const detail = PROFILE_DETAILS["4"];
  assert.equal(detail.nameKo, "김서은");
  assert.equal(detail.projectName, "REBLOOM");
  assert.match(detail.introduction, /^차근차근 앞으로 나아가는 김서은입니다\./);
  assert.equal(detail.instagram, "seo_eun_214");
  assert.equal(detail.email, "tjdms0214@daum.net");
  assert.deepEqual(detail.tags, ["BRANDING", "EDITORIAL", "PACKAGE"]);
  assert.equal(detail.interview.length, 2);
  assert.match(detail.interview[0].answer, /^저를 움직이게 만드는 불씨는 더 나아가고 싶은 마음입니다\./);
  assert.match(detail.interview[1].answer, /끝까지 해낼 수 있는 사람이라는 것을 발견했습니다\.$/);

  const html = renderToStaticMarkup(React.createElement(ProfileDetailPage, { detail }));
  assert.doesNotMatch(html, /소개 준비 중/);
  assert.doesNotMatch(html, /인터뷰 준비 중/);
  assert.match(html, /차근차근 앞으로 나아가는 김서은입니다/);
  assert.match(html, /instagram\.com\/seo_eun_214\//);
  assert.doesNotMatch(html, /브랜딩과 편집 디자인을 바탕으로/);
  assert.match(html, /href="\/work\/4"/);
  assert.match(html, /kim-seoeun%2Fhero\.webp/);
  assert.doesNotMatch(html, /작품 이미지는 준비 중입니다/);
});

test("양혜연 작품 연결은 내부 한글 표기 안내 없이 MOOEE만 표시한다", () => {
  const html = renderToStaticMarkup(React.createElement(ProfileDetailPage, { detail: PROFILE_DETAILS["11"] }));
  assert.match(html, /class="profile-work-preview__title">MOOEE<\/h3>/);
  assert.match(html, /aria-label="양혜연 MOOEE 작품 보기"/);
  assert.match(html, /alt="MOOEE 작품 대표 이미지"/);
  assert.doesNotMatch(html, /한글 표기 필요할 시/);
});

test("시트의 긴 문장은 글자 수 제한 때문에 잘리지 않는다", () => {
  assert.ok(PROFILE_DETAILS["5"].interview[1].answer.length > 200);
});

test("공동 작가 두 사람의 프로필 Work는 같은 공동 작품 상세로 이동한다", () => {
  for (const name of ["박규리", "이다혜"]) {
    const detail = Object.values(PROFILE_DETAILS).find(item => item.nameKo === name);
    const html = renderToStaticMarkup(React.createElement(ProfileDetailPage, { detail }));
    assert.match(html, /href="\/work\/9"/);
    assert.match(html, /park-gyuri-lee-dahye%2Fhero\.webp/);
    assert.doesNotMatch(html, /작품 이미지는 준비 중입니다/);
  }
});

test("20개 상세 경로를 빌드 시 미리 생성한다", async () => {
  const route = await import("./[id]/page.tsx");
  assert.equal(typeof route.generateStaticParams, "function");
  assert.deepEqual(route.generateStaticParams(),
    PROFILE_MEMBERS.map(({ id }) => ({ id: String(id) })));
});
