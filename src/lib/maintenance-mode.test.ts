import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { isMaintenanceMode, SITE_OPENS_AT } from "./maintenance-mode";

const originalMode = process.env.SITE_MAINTENANCE_MODE;
afterEach(() => {
  if (originalMode === undefined) delete process.env.SITE_MAINTENANCE_MODE;
  else process.env.SITE_MAINTENANCE_MODE = originalMode;
});

test("공개 시각은 한국 시간 10월 20일 오전 9시다", () => {
  assert.equal(new Date(SITE_OPENS_AT).toISOString(), "2026-10-20T00:00:00.000Z");
});

for (const mode of [undefined, "auto"]) {
  test(`${mode ?? "기본"} 모드는 공개 직전까지 닫고 정각부터 공개한다`, () => {
    if (mode === undefined) delete process.env.SITE_MAINTENANCE_MODE;
    else process.env.SITE_MAINTENANCE_MODE = mode;
    const opening = Date.parse(SITE_OPENS_AT);
    assert.equal(isMaintenanceMode(opening - 1), true);
    assert.equal(isMaintenanceMode(opening), false);
    assert.equal(isMaintenanceMode(opening + 86400000), false);
  });
}

test("개발용 off는 오픈 전에도 내부 페이지를 허용한다", () => {
  process.env.SITE_MAINTENANCE_MODE = "off";
  assert.equal(isMaintenanceMode(Date.parse(SITE_OPENS_AT) - 1), false);
});

test("긴급 차단 on은 오픈 시각 이후에도 유지된다", () => {
  process.env.SITE_MAINTENANCE_MODE = "on";
  assert.equal(isMaintenanceMode(Date.parse(SITE_OPENS_AT) + 1), true);
});

test("잘못 입력한 설정은 조기 공개하지 않는다", () => {
  process.env.SITE_MAINTENANCE_MODE = "invalid";
  assert.equal(isMaintenanceMode(Date.parse(SITE_OPENS_AT) + 1), true);
});
