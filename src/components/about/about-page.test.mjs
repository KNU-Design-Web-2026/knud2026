import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("600px부터 821px까지 About 페이지는 600px 이하 공통 프레임 토큰을 유지한다", async () => {
  const page = await readFile(new URL("./about-page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(page, /data-about-page/);
  assert.match(styles, /@media \(min-width: 37\.5rem\) and \(max-width: 51\.3125rem\)/);
  assert.match(styles, /:global\(body:has\(\[data-about-page\]\)\)/);
  assert.match(styles, /--header-height: 5rem;/);
  assert.match(styles, /--footer-height: 12\.5rem;/);
});

test("822px부터 1020px까지 소개 프레임이 뷰포트와 함께 축소된다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /width: calc\(-37\.636px \+ 92\.121vw\)/);
  assert.match(styles, /height: calc\(-39\.818px \+ 59\.394vw\)/);
  assert.doesNotMatch(styles, /width: clamp\(902px,/);
  assert.doesNotMatch(styles, /height: clamp\(566px,/);
});

test("중간 화면의 소개 영역 높이와 제목 크기가 고정 하한 없이 보간된다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /height: calc\(-296\.909px \+ 105\.294vw\)/);
  assert.match(styles, /font-size: clamp\(18px, calc\(-0\.727px \+ 2\.424vw\), 32px\)/);
});

test("822px부터 1020px까지 소개 텍스트와 문단 간격을 함께 축소한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(min-width: 822px\) and \(max-width: 1020px\)/);
  assert.match(styles, /font-size: calc\(-6\.348px \+ 2\.191vw\)/);
  assert.match(styles, /margin-top: calc\(-2\.255px \+ 1\.594vw\)/);
  assert.match(styles, /font-size: calc\(-0\.227px \+ 1\.395vw\)/);
});

test("웹 교수진 패널과 사자는 Figma 비율을 유지한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /\.professorsGrid \{[\s\S]*?margin-left: 353px;/);
  assert.match(styles, /margin-left: calc\(-206\.16px \+ 29\.123vw\)/);
  assert.match(styles, /\.professorsLion \{[\s\S]*?bottom: 3\.51%;[\s\S]*?left: 63\.544%;[\s\S]*?width: 36\.456%;[\s\S]*?height: auto;/);
});

test("822px 이상 교수진 사자는 패널 기준 비율로 함께 이동한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /\.professorsLion \{[\s\S]*?bottom: 3\.51%;[\s\S]*?left: 63\.544%;[\s\S]*?width: 36\.456%;[\s\S]*?height: auto;/);
  assert.doesNotMatch(styles, /bottom: calc\(49\.211px - 1\.053vw\)/);
  assert.doesNotMatch(styles, /left: calc\(141\.684px \+ 44\.912vw\)/);
  assert.doesNotMatch(styles, /right: clamp\(-20px, calc\(-51px \+ 3\.03vw\), -10px\)/);
  assert.match(styles, /\.professorsLionWide \{[\s\S]*?left: max\([\s\S]*?var\(--professors-grid-left\)[\s\S]*?var\(--professors-grid-width\)/);
});

test("중간 웹 위원회 텍스트는 Figma 좌표와 크기로 보간된다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /--committee-info-left: calc\(-58\.366px \+ 24\.62vw\)/);
  assert.match(styles, /width: calc\(64\.547px \+ 64\.404vw\)/);
  assert.match(styles, /padding-top: 11\.482vw/);
  assert.match(styles, /grid-template-columns: calc\(35\.726px \+ 13\.205vw\) minmax\(0, 1fr\)/);
  assert.match(styles, /column-gap: calc\(-0\.002px \+ 7\.259vw\)/);
  assert.match(styles, /font-size: calc\(5\.636px \+ 1\.212vw\)/);
  assert.match(styles, /grid-template-columns: calc\(29\.909px \+ 10\.303vw\) minmax\(0, 1fr\)/);
});

test("지도와 전시 정보 이미지는 1020px 이하에서도 대칭 여백을 유지한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /--offline-side: clamp\(38px, 4\.902vw, 51px\)/);
  assert.match(styles, /left: var\(--offline-side\)/);
  assert.match(styles, /width: calc\(100vw - var\(--offline-side\) - var\(--offline-side\)\)/);
  assert.doesNotMatch(styles, /width: clamp\(920px, calc\(-94\.545px \+ 99\.455vw\), 1248px\)/);
});

test("모바일 위원회 텍스트는 Figma 좌측 여백과 글자 크기를 유지한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /width: clamp\(276px, calc\(46px \+ 57\.5vw\), 391px\)/);
  assert.match(styles, /margin-left: clamp\(66px, calc\(10px \+ 14vw\), 94px\)/);
  assert.match(styles, /grid-template-columns: clamp\(158px, calc\(26px \+ 33vw\), 224px\) minmax\(0, 1fr\)/);
  assert.match(styles, /font-size: clamp\(10px, calc\(2px \+ 2vw\), 14px\)/);
  assert.match(styles, /font-size: clamp\(14px, calc\(2px \+ 3vw\), 20px\)/);
});

test("위원회 일러스트와 위원장 이름 간격을 조정한다", async () => {
  const page = await readFile(new URL("./about-page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(page, /className=\{styles\.chairNames\}/);
  assert.match(page, /<span>윤이지<\/span>[\s\S]*?<span>김가연<\/span>/);
  assert.match(styles, /\.chairNames \{[\s\S]*?row-gap: 18px;/);
  assert.match(styles, /\.committeeIllustration \{[\s\S]*?bottom: 10px;[\s\S]*?left: 70px;/);
  assert.match(styles, /bottom: calc\(43\.684px - 1\.754vw\)/);
  assert.match(styles, /left: calc\(137\.368px - 3\.509vw\)/);
  assert.match(styles, /\.committeeIllustration \{[\s\S]*?bottom: clamp\(12px, 2vw, 20px\);[\s\S]*?left: clamp\(35px, calc\(-50\.4px \+ 10\.4vw\), 90px\);/);
});

test("모바일과 태블릿의 교수진 사자는 Figma 전용 에셋과 규격을 사용한다", async () => {
  const page = await readFile(new URL("./about-page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");
  const artwork = await readFile(
    new URL("../../../public/assets/figma/about/professors-lion-tab-mobile.svg", import.meta.url),
    "utf8",
  );

  assert.match(page, /professors-lion-tab-mobile\.svg/);
  assert.doesNotMatch(page, /professors-lion-tab-mobile\.png/);
  assert.match(artwork, /<svg[^>]+fill="none"/);
  assert.equal(artwork.match(/data:image\/svg\+xml;base64/g)?.length, 13);
  assert.match(page, /professorsLionNarrow/);
  assert.doesNotMatch(styles, /transform: scaleY\(0\.7\)/);
  assert.match(styles, /width: clamp\(144px, 37\.5vw, 225px\)/);
  assert.match(styles, /right: clamp\(-9px, calc\(15px - 4vw\), -1px\)/);
  assert.match(styles, /bottom: clamp\(-52px, calc\(1px - 8\.833vw\), -34px\)/);
  assert.match(styles, /\.committeeIllustration \{[\s\S]*?bottom: clamp\(-40px, calc\(-8px - 9vw\), -44px\)/);
});

test("600px Figma 탭 시안의 교수진과 위원회 패널 비율을 유지한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /height: max\(246px, calc\(42px \+ 51vw\)\)/);
  assert.match(styles, /width: 62\.943%;/);
  assert.match(styles, /margin-left: 10\.993%;/);
  assert.match(styles, /height: max\(424px, calc\(70px \+ 88\.5vw\)\)/);
  assert.match(styles, /width: clamp\(276px, calc\(46px \+ 57\.5vw\), 391px\)/);
  assert.match(styles, /margin-left: clamp\(66px, calc\(10px \+ 14vw\), 94px\)/);
  assert.match(styles, /grid-template-columns: clamp\(158px, calc\(26px \+ 33vw\), 224px\) minmax\(0, 1fr\)/);
});

test("821px 이하 교수진과 위원회는 clamp 기반의 모바일 구성을 사용한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(max-width: 821px\)/);
  assert.match(styles, /\.professorsSection \{[\s\S]*?width: max\(398px, calc\(66px \+ 83vw\)\)/);
  assert.match(styles, /\.professorsLionNarrow \{[\s\S]*?right: clamp\(-9px, calc\(15px - 4vw\), -1px\)[\s\S]*?width: clamp\(144px, 37\.5vw, 225px\)/);
  assert.match(styles, /\.committeeSection \{[\s\S]*?height: max\(497px, calc\(81px \+ 104vw\)\)/);
  assert.match(styles, /\.committeeIllustration \{[\s\S]*?bottom: clamp\(-40px, calc\(-8px - 9vw\), -44px\)[\s\S]*?width: clamp\(170px, calc\(28px \+ 35\.5vw\), 241px\)/);
  assert.doesNotMatch(styles, /@media \(min-width: 600px\)/);
});

test("821px 이하에서는 교수진과 위원회에 동일한 탭·모바일 종이 asset을 사용한다", async () => {
  const page = await readFile(new URL("./about-page.tsx", import.meta.url), "utf8");

  assert.match(page, /media="\(max-width: 821px\)" srcSet="\/assets\/figma\/about\/professors-wave-tab-mobile\.svg"/);
  assert.match(page, /media="\(max-width: 821px\)" srcSet="\/assets\/figma\/about\/committee-wave-tab-mobile\.svg"/);
  assert.doesNotMatch(page, /media="\(max-width: 600px\)" srcSet="\/assets\/figma\/about\/(professors|committee)-wave-tab-mobile\.svg"/);
});

test("600px부터 821px까지 교수진 패널은 빈 공간을 줄이는 완만한 높이 보간을 사용한다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(min-width: 600\.0625px\) and \(max-width: 821px\)/);
  assert.match(styles, /\.professorsSection \{[\s\S]*?height: calc\(260\.68px \+ 24\.887vw\)/);
  assert.match(styles, /\.professorsPanel \{[\s\S]*?height: calc\(149\.69px \+ 33\.052vw\)/);
});

test("650px부터 800px까지 Graduation 파란 패널은 asset 여백만큼 높이를 줄인다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(min-width: 650px\) and \(max-width: 800px\)/);
  assert.match(styles, /\.committeeSection \{[\s\S]*?height: calc\(661\.667px \+ 14\.667vw\)/);
  assert.match(styles, /\.committeePanel \{[\s\S]*?height: calc\(647\.417px - 0\.333vw\)/);
  assert.doesNotMatch(styles, /bottom: calc\(-624\.667px \+ 89\.333vw\)/);
});

test("650px부터 800px까지 Professors 파란 패널은 사자와 텍스트를 유지하며 높이를 줄인다", async () => {
  const styles = await readFile(new URL("./about-page.module.css", import.meta.url), "utf8");

  assert.match(styles, /\.professorsSection \{[\s\S]*?height: calc\(434\.013px - 1\.78vw\)/);
  assert.match(styles, /\.professorsPanel \{[\s\S]*?height: calc\(323\.023px \+ 6\.385vw\)/);
  assert.match(styles, /\.professorsLionNarrow \{[\s\S]*?bottom: calc\(121\.333px - 26\.667vw\)/);
});
