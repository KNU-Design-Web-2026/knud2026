import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const profileCardPath = new URL("../../components/profile/profile-card.tsx", import.meta.url);
const detailComponentPath = new URL("../../components/profile/profile-detail-page.tsx", import.meta.url);
const detailDataPath = new URL("../../data/profile-details.ts", import.meta.url);
const detailRoutePath = new URL("./[id]/page.tsx", import.meta.url);

test("첫 번째 프로필 카드는 상세 초안 경로로 이동한다", async () => {
  const profileCard = await readFile(profileCardPath, "utf8");

  assert.match(profileCard, /member\.id === 1/);
  assert.match(profileCard, /href=\{`\/profile\/\$\{member\.id\}`\}/);
});

test("상세 초안은 Figma 원본 자산과 Web 섹션 구조를 사용한다", async () => {
  const [component, data] = await Promise.all([
    readFile(detailComponentPath, "utf8"),
    readFile(detailDataPath, "utf8"),
  ]);

  assert.match(data, /profile-01\.jpeg/);
  assert.match(data, /profile-01-work-01\.png/);
  assert.match(component, /grid-cols-\[35rem_minmax\(0,1fr\)\]/);
  assert.match(component, /h-\[47\.8125rem\] w-\[35rem\]/);
  assert.match(component, /Interview/);
  assert.match(component, /Work/);
});

test("존재하지 않는 프로필 식별자는 404 처리한다", async () => {
  const route = await readFile(detailRoutePath, "utf8");

  assert.match(route, /notFound\(\)/);
  assert.match(route, /PROFILE_DETAILS\[id\]/);
});
