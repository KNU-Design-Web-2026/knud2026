import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnalyticsTracker } from "./google-analytics";

function setup(overrides: Record<string, unknown> = {}) {
  const commands: unknown[][] = [];
  let scriptLoads = 0;
  const track = createAnalyticsTracker({
    environment: "production",
    referrer: "https://search.naver.com/search.naver?query=private#secret",
    send: (...args: unknown[]) => { commands.push(args); },
    loadScript: () => { scriptLoads += 1; },
    ...overrides,
  });
  return { track, commands, scriptLoads: () => scriptLoads };
}

test("운영 도메인의 첫 방문은 새 GA 속성에 한 번 전송하고 태그를 한 번만 요청한다", () => {
  const result = setup();
  assert.equal(result.track("https://www.2026-knud-graduation.com/"), true);
  assert.equal(result.scriptLoads(), 1);
  assert.deepEqual(result.commands.find(([command]) => command === "config"), [
    "config", "G-J9DDCHCRMF", {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    },
  ]);
  assert.deepEqual(result.commands.at(-1), ["event", "page_view", {
    send_to: "G-J9DDCHCRMF",
    page_location: "https://www.2026-knud-graduation.com/",
    page_referrer: "https://search.naver.com/",
    page_title: "IGNITE | KNUD 2026",
  }]);
});

test("검수·개발 주소와 운영 환경이 아닌 빌드에서는 태그 요청과 이벤트 모두 없다", () => {
  for (const environment of [undefined, "development", "preview"]) {
    const result = setup({ environment });
    assert.equal(result.track("https://www.2026-knud-graduation.com/work/1"), false);
    assert.equal(result.scriptLoads(), 0);
    assert.deepEqual(result.commands, []);
  }
  for (const href of [
    "http://localhost:3000/", "https://localhost/", "http://www.2026-knud-graduation.com/",
    "https://knud-2026-exhibition-1ypbmz6ni-junsublees-projects.vercel.app/",
    "https://www.2026-knud-graduation.com.evil.example/",
    "https://www.2026-knud-graduation.com:3000/", "not a URL",
  ]) {
    const result = setup();
    assert.equal(result.track(href), false, href);
    assert.equal(result.scriptLoads(), 0);
    assert.deepEqual(result.commands, []);
  }
});

test("광고 동의는 거부하고 브라우저 추적 거부도 존중한다", () => {
  const result = setup();
  result.track("https://2026-knud-graduation.com/");
  assert.deepEqual(result.commands[0], ["consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  }]);
  for (const overrides of [{ doNotTrack: true }, { globalPrivacyControl: true }]) {
    const denied = setup(overrides);
    assert.equal(denied.track("https://www.2026-knud-graduation.com/"), false);
    assert.equal(denied.scriptLoads(), 0);
    assert.deepEqual(denied.commands, []);
  }
});

test("같은 경로 재렌더·쿼리·해시 변경은 중복 집계하지 않고 실제 왕복 이동은 집계한다", () => {
  const result = setup();
  assert.equal(result.track("https://www.2026-knud-graduation.com/work"), true);
  assert.equal(result.track("https://www.2026-knud-graduation.com/work?email=private#secret"), false);
  assert.equal(result.track("https://www.2026-knud-graduation.com/work/1"), true);
  assert.equal(result.track("https://www.2026-knud-graduation.com/work"), true);
  assert.equal(result.scriptLoads(), 1);
  assert.equal(result.commands.filter(([command]) => command === "config").length, 1);
  const events = result.commands.filter(([command]) => command === "event");
  assert.equal(events.length, 3);
  assert.deepEqual(events[1], ["event", "page_view", {
    send_to: "G-J9DDCHCRMF", page_title: "WORKS | KNUD 2026",
    page_location: "https://www.2026-knud-graduation.com/work/1",
    page_referrer: "https://www.2026-knud-graduation.com/work",
  }]);
  assert.equal(JSON.stringify(result.commands).includes("private"), false);
  assert.equal(JSON.stringify(result.commands).includes("secret"), false);
});

test("메시지 페이지는 경로만 전송하고 입력·임의 경로·관리자·API·실험 화면은 수집하지 않는다", () => {
  const result = setup({ referrer: "not a URL" });
  result.track("https://www.2026-knud-graduation.com/message?from=private&body=secret#name");
  assert.deepEqual(result.commands.at(-1), ["event", "page_view", {
    send_to: "G-J9DDCHCRMF", page_title: "MESSAGE | KNUD 2026",
    page_location: "https://www.2026-knud-graduation.com/message", page_referrer: "",
  }]);
  const count = result.commands.length;
  for (const path of ["/admin", "/api/letters", "/experiments/archive-performance", "/private-person", "/work/private", "/profile/private"]) {
    assert.equal(result.track(`https://www.2026-knud-graduation.com${path}`), false);
  }
  assert.equal(result.commands.length, count);
  assert.equal(JSON.stringify(result.commands).includes("private"), false);
  assert.equal(JSON.stringify(result.commands).includes("secret"), false);
});

test("공개된 전시 경로와 숫자 작품·프로필만 집계한다", () => {
  for (const path of ["/", "/about", "/work", "/work/1", "/profile", "/profile/20", "/space", "/message"]) {
    const result = setup();
    assert.equal(result.track(`https://www.2026-knud-graduation.com${path}`), true, path);
  }
});

test("페이지 이동 후 자동 세션·참여 이벤트의 기본 문맥도 현재 페이지를 가리킨다", () => {
  const result = setup();
  result.track("https://www.2026-knud-graduation.com/");
  result.track("https://www.2026-knud-graduation.com/work/1?body=private");
  let globalFields: Record<string, unknown> = {};
  let targetFields: Record<string, unknown> = {};
  // Google's config scope takes precedence over set for events without overrides.
  for (const [command, first, second] of result.commands) {
    if (command === "set") globalFields = { ...globalFields, ...first as Record<string, unknown> };
    if (command === "config") targetFields = { ...targetFields, ...second as Record<string, unknown> };
  }
  const automaticEvent = { ...globalFields, ...targetFields };
  assert.equal(automaticEvent.page_location, "https://www.2026-knud-graduation.com/work/1");
  assert.equal(automaticEvent.page_title, "WORKS | KNUD 2026");
  assert.equal(automaticEvent.page_referrer, "https://www.2026-knud-graduation.com/");
  assert.equal(result.commands.findIndex(([command]) => command === "set") <
    result.commands.findIndex(([command]) => command === "config"), true);
});
