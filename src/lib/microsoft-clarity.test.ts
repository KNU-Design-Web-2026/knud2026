import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CLARITY_PROJECT_ID, initializeClarity } from "./microsoft-clarity";

function setup(overrides: Record<string, unknown> = {}) {
  const calls: unknown[][] = [];
  const initialized = initializeClarity({
    environment: "production", href: "https://www.2026-knud-graduation.com/",
    scriptExists: false,
    send: (...args: unknown[]) => { calls.push(args); },
    loadScript: () => { calls.push(["load"]); },
    ...overrides,
  });
  return { initialized, calls };
}

test("Clarity 공개 프로젝트에 연결하기 전 광고·분석 저장 거부를 먼저 큐에 넣는다", () => {
  assert.equal(CLARITY_PROJECT_ID, "z00yn7m096");
  assert.deepEqual(setup(), { initialized: true, calls: [
    ["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }], ["load"],
  ] });
});

test("production 외 환경과 localhost·Vercel 별칭에서는 태그나 큐를 만들지 않는다", () => {
  for (const environment of [undefined, "development", "preview"]) {
    assert.deepEqual(setup({ environment }), { initialized: false, calls: [] });
  }
  for (const href of [
    "http://localhost:3000/", "https://localhost/", "http://www.2026-knud-graduation.com/",
    "https://knud-2026-exhibition-pclf3efk3-junsublees-projects.vercel.app/",
    "https://www.2026-knud-graduation.com.evil.example/",
    "https://www.2026-knud-graduation.com:3000/", "not a URL",
    "https://private:secret@www.2026-knud-graduation.com/",
  ]) assert.deepEqual(setup({ href }), { initialized: false, calls: [] }, href);
});

test("DNT·GPC와 이미 삽입된 태그가 있으면 초기화하지 않는다", () => {
  for (const overrides of [{ doNotTrack: true }, { globalPrivacyControl: true }, { scriptExists: true }]) {
    assert.deepEqual(setup(overrides), { initialized: false, calls: [] });
  }
});

test("공개 전시 경로만 초기화하고 쿼리·해시·비공개 진입은 제외한다", () => {
  for (const path of ["/", "/about", "/work", "/work/1", "/profile", "/profile/20", "/space", "/message"]) {
    assert.equal(setup({ href: `https://2026-knud-graduation.com${path}` }).initialized, true, path);
  }
  for (const path of ["/?email=private", "/work#secret", "/admin", "/api/letters", "/experiments/archive-performance", "/work/private", "/about/1"]) {
    assert.deepEqual(setup({ href: `https://www.2026-knud-graduation.com${path}` }), { initialized: false, calls: [] }, path);
  }
});

test("유입 URL에 쿼리·해시·외부 상세 경로가 있으면 녹화를 시작하지 않는다", () => {
  for (const referrer of ["https://search.naver.com/?query=private", "https://example.com/#private", "https://example.com/private", "invalid"]) {
    assert.deepEqual(setup({ referrer }), { initialized: false, calls: [] }, referrer);
  }
  for (const referrer of ["", "https://www.google.com/", "https://www.2026-knud-graduation.com/work/1"]) {
    assert.equal(setup({ referrer }).initialized, true, referrer);
  }
});

test("초기 HTML은 기본 마스킹하고 MESSAGE의 공개 예외는 정적 장식으로 제한한다", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const message = readFileSync(new URL("../components/message/message-page.tsx", import.meta.url), "utf8");
  const client = readFileSync(new URL("../components/layout/microsoft-clarity.tsx", import.meta.url), "utf8");
  assert.match(layout, /<body data-clarity-mask="true"/);
  assert.match(layout, /process\.env\.VERCEL_ENV === "production" && <MicrosoftClarity/);
  assert.match(message, /<section className="message-page" data-clarity-mask="true"/);
  assert.doesNotMatch(layout, /data-clarity-unmask/);
  assert.match(client, /script\.async = true/);
  assert.match(client, /script\.referrerPolicy = "origin"/);
  assert.match(client, /send\.q\.push\(arguments\)/);
  assert.doesNotMatch(client, /\.value|\.textContent|\.innerText|"identify"/);
});
