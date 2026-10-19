import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import nextConfig from "../../next.config.ts";
import { WorkDetailPage } from "../components/work/work-detail-page.tsx";
import { ProfileDetailPage } from "../components/profile/profile-detail-page.tsx";
import { MessagePage } from "../components/message/message-page.tsx";
import { WORK_DETAILS } from "../data/work-details.ts";
import { PROFILE_DETAILS } from "../data/profile-details.ts";

const require = createRequire(import.meta.url);
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime.js");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config.js");
const projectConfig = nextConfig.default ?? nextConfig;

function render(component, props) {
  return renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, {
    value: { ...imageConfigDefault, ...projectConfig.images },
  }, React.createElement(component, props)));
}

function tagWithClass(markup, className) {
  const tag = [...markup.matchAll(/<[a-z][^>]*>/g)].find(([tag]) => {
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
    return classes.includes(className);
  })?.[0];
  assert.ok(tag, `missing ${className}`);
  return tag;
}

test("작품 상세의 실제 SSR은 공개 작품을 허용하면서 작가 연락처를 별도로 가린다", () => {
  for (const detail of Object.values(WORK_DETAILS)) {
    const markup = render(WorkDetailPage, { detail });
    assert.match(tagWithClass(markup, "work-detail"), /data-clarity-unmask="true"/);
    assert.match(tagWithClass(markup, "work-detail__contact"), /data-clarity-mask="true"/);
    const contact = markup.match(/<address\b[^>]*>[\s\S]*?<\/address>/)?.[0];
    assert.ok(contact);
    assert.doesNotMatch(contact, /data-clarity-unmask/);
  }
});

test("모든 프로필은 공개 사진·이름·분야·작품만 허용하고 연락처·소개·인터뷰는 가린다", () => {
  for (const detail of Object.values(PROFILE_DETAILS)) {
    const markup = render(ProfileDetailPage, { detail });
    assert.doesNotMatch(tagWithClass(markup, "profile-detail"), /data-clarity-unmask/);
    for (const className of ["profile-detail__portrait", "profile-detail__names", "profile-detail__tags", "profile-detail__work-copy"]) {
      assert.match(tagWithClass(markup, className), /data-clarity-unmask="true"/, className);
    }
    for (const className of ["profile-detail__contact", "profile-detail__introduction", "profile-detail__interview-list"]) {
      assert.match(tagWithClass(markup, className), /data-clarity-mask="true"/, className);
    }
    const contact = markup.match(/<dl\b[^>]*>[\s\S]*?<\/dl>/)?.[0];
    assert.ok(contact);
    assert.doesNotMatch(contact, /data-clarity-unmask/);
  }
});

test("MESSAGE의 실제 SSR은 작성 폼과 편지 영역에 공개 허용을 상속시키지 않는다", () => {
  const markup = render(MessagePage, { initialMessages: [{
    id: "privacy-fixture", to: "김서은", from: "비공개 작성자",
    body: "녹화에 드러나면 안 되는 편지 본문", createdAt: "2026-10-19T00:00:00.000Z",
  }] });
  assert.match(tagWithClass(markup, "message-page"), /data-clarity-mask="true"/);
  const form = markup.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(form);
  assert.doesNotMatch(form, /data-clarity-unmask/);
  assert.doesNotMatch(tagWithClass(markup, "message-list-container"), /data-clarity-unmask/);
  const card = markup.match(/<article\b[^>]*class="message-card[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.match(card, /비공개 작성자/);
  assert.match(card, /녹화에 드러나면 안 되는 편지 본문/);
  assert.doesNotMatch(card, /data-clarity-unmask/);
});
