import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const originalMode = process.env.SITE_MAINTENANCE_MODE;

afterEach(() => {
  if (originalMode === undefined) {
    delete process.env.SITE_MAINTENANCE_MODE;
  } else {
    process.env.SITE_MAINTENANCE_MODE = originalMode;
  }
});

test("준비 중에는 전시 페이지의 직접 접근을 홈으로 돌려보낸다", () => {
  process.env.SITE_MAINTENANCE_MODE = "on";

  for (const path of ["/about", "/work/1", "/profile/1", "/space", "/message"]) {
    const response = proxy(new NextRequest(`https://example.com${path}`));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "https://example.com/");
  }
});

test("준비 중에는 메시지 API가 데이터를 조회하거나 저장하지 않는다", () => {
  process.env.SITE_MAINTENANCE_MODE = "on";

  for (const method of ["GET", "POST"]) {
    const response = proxy(new NextRequest("https://example.com/api/letters", { method }));
    assert.equal(response.status, 503);
  }
});

test("준비 중에도 홈과 로고 자산 요청은 통과한다", () => {
  process.env.SITE_MAINTENANCE_MODE = "on";

  for (const path of ["/", "/assets/figma/header-logo-2026-1.svg"]) {
    const response = proxy(new NextRequest(`https://example.com${path}`));
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
});

test("전환을 끄면 기존 경로와 API가 다시 통과한다", () => {
  process.env.SITE_MAINTENANCE_MODE = "off";

  for (const path of ["/work/1", "/api/letters"]) {
    const response = proxy(new NextRequest(`https://example.com${path}`));
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
});
