import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { createWorkImagePreview } from "../../../scripts/work-image-preview.mjs";

const importer = new URL("../../../scripts/import-work-assets.mjs", import.meta.url).pathname;

for (const scenario of [
  { artist: "김연수", folder: "포토폴리오", thumbs: ["김연수_Work.png", "김연수_SPACE.png", "김연수_상세.png"], pages: ["김연수_002.png", "김연수_001.png"], order: [1, 2] },
  { artist: "김민주", thumbs: ["work_썸네일.png", "space_썸네일.png", "상세페이지_썸네일.png"], pages: ["웹팀포트폴리오-10.png", "웹팀포트폴리오-02.png", "웹팀포트폴리오-01.png"], order: [1, 2, 10] },
  { artist: "이나경", thumbs: ["이나경 (work,space,상세페이지)-03.png", "이나경 (work,space,상세페이지)-02.png", "이나경 (work,space,상세페이지)-01.png"], pages: ["이나경 본문-02.png", "이나경 본문-01.png"], order: [1, 2] },
  { artist: "이서윤", thumbs: ["이서윤_Work.png", "이서윤_SPACE.png", "이서윤_상세.png"], pages: ["10.png", "2.png", "1.png"], order: [1, 2, 10] },
  { artist: "김세직", thumbs: ["WORK_썸네일_384x280.png", "SPACE_썸네일_624x382.png", "상세페이지_썸네일_1920x1050.png"], pages: ["졸전 웹페이지_김세직-09.png", "졸전 웹페이지_김세직-01.png"], order: [1, 9] },
  { artist: "박규리 & 이다혜", artistFolder: "박규리&이다혜_웹work", thumbs: ["박규리&이다혜_Work.png", "박규리&이다혜_SPACE.png", "박규리&이다혜_상세.png"], pages: ["박규리&이다혜_002.png", "박규리&이다혜_001.png"], order: [1, 2] },
  { artist: "김서은", folder: "김서은_포트폴리오", thumbs: ["김서은_Work.png", "졸전_웹상세-08.png", "김서은_상세.png"], pages: ["김서은_005.png", "김서은_001.png"], order: [1, 5], spaceSource: "졸전_웹상세-08.png" },
]) {
  test(`${scenario.artist} 제출 파일명에서도 용도별 썸네일과 숫자순 상세를 정확히 가져온다`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "knud-work-import-"));
    try {
      const source = path.join(root, "source");
      const artistRoot = path.join(source, (scenario.artistFolder ?? `${scenario.artist}_웹work`).normalize("NFD"));
      const thumbs = path.join(artistRoot, "썸네일");
      const portfolio = path.join(artistRoot, scenario.folder ?? "포트폴리오");
      await mkdir(thumbs, { recursive: true });
      await mkdir(portfolio, { recursive: true });
      for (const [i, name] of scenario.thumbs.entries()) {
        await sharp({ create: { width: [8, 12, 16][i], height: [6, 7, 9][i], channels: 3, background: "white" } }).png().toFile(path.join(thumbs, name.normalize("NFD")));
      }
      for (const name of scenario.pages) {
        const number = Number(name.match(/(\d+)\.png$/)[1]);
        await sharp({ create: { width: 16, height: 20 + number, channels: 3, background: "white" } }).png().toFile(path.join(portfolio, name.normalize("NFD")));
      }
      // Resource forks must never be interpreted as pictures.
      await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toFile(path.join(portfolio, "._008.png"));
      const result = spawnSync(process.execPath, [importer, source, scenario.artist, "test-artist", ...(scenario.spaceSource ? ["--space-source", scenario.spaceSource] : [])], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const manifest = JSON.parse(await readFile(path.join(root, "public/assets/works/test-artist/manifest.json"), "utf8"));
      assert.deepEqual([manifest.thumbnail.width, manifest.space.width, manifest.hero.width], [8, 12, 16]);
      assert.deepEqual(manifest.images.map(image => image.height), scenario.order.map(number => 20 + number));
      assert.ok(manifest.images.every(image => !image.sourceFile.includes("._")));
      if (scenario.spaceSource) assert.ok(manifest.space.sourceFile.endsWith(scenario.spaceSource));
      for (const image of [manifest.thumbnail, manifest.space, manifest.hero, ...manifest.images]) {
        assert.match(image.blurDataURL, /^data:image\/webp;base64,/);
        const preview = await sharp(Buffer.from(image.blurDataURL.split(",")[1], "base64")).metadata();
        assert.ok(preview.width <= image.width && preview.height <= image.height);
        assert.ok(image.blurDataURL.length < 1024);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("미리보기는 사진을 구분할 해상도를 유지하고 복잡한 이미지도 4KiB 이내로 제한한다", async () => {
  const source = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#08ade7" } })
    .composite([{ input: Buffer.from('<svg width="1200" height="800"><rect x="300" y="200" width="600" height="400" fill="#ffdf00"/></svg>') }])
    .png().toBuffer();
  const dataURL = await createWorkImagePreview(source);
  const bytes = Buffer.from(dataURL.split(",")[1], "base64");
  const image = sharp(bytes);
  const metadata = await image.metadata();
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 171);
  assert.ok(bytes.length <= 4096);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
  assert.ok(data[center] > 220 && data[center + 1] > 190 && data[center + 2] < 40);

  // Deterministic noise exercises the byte-budget fallback, unlike a flat fixture.
  const noise = Buffer.alloc(600 * 600 * 3);
  let seed = 42;
  for (let i = 0; i < noise.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise[i] = seed >>> 24;
  }
  const noisySource = await sharp(noise, { raw: { width: 600, height: 600, channels: 3 } }).png().toBuffer();
  const noisyPreview = Buffer.from((await createWorkImagePreview(noisySource)).split(",")[1], "base64");
  const noisyMetadata = await sharp(noisyPreview).metadata();
  assert.ok(noisyPreview.length <= 4096);
  assert.ok(noisyMetadata.width >= 64 && noisyMetadata.width <= 256);
  assert.equal(noisyMetadata.width, noisyMetadata.height);
});

test("GIF는 원본 프레임을 보존하고 숫자 순서와 정지 미리보기를 제공한다", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "knud-gif-import-"));
  try {
    const source = path.join(root, "source");
    const artistRoot = path.join(source, "김지언_웹work");
    const portfolio = path.join(artistRoot, "포트폴리오");
    await mkdir(portfolio, { recursive: true });
    for (const name of ["김지언_Work.png", "김지언_SPACE.png", "김지언_상세.png"]) {
      await sharp({ create: { width: 16, height: 8, channels: 3, background: "white" } }).png().toFile(path.join(artistRoot, name));
    }
    const frames = Buffer.concat([Buffer.alloc(16 * 8 * 3, 0), Buffer.alloc(16 * 8 * 3, 255)]);
    const gifPath = path.join(portfolio, "김지언_002.gif");
    await sharp(frames, { raw: { width: 16, height: 16, channels: 3, pageHeight: 8 } }).gif({ delay: [100, 100], loop: 0 }).toFile(gifPath);
    for (const n of [1, 3]) await sharp({ create: { width: 16, height: 8, channels: 3, background: "white" } }).png().toFile(path.join(portfolio, `김지언_00${n}.png`));
    const result = spawnSync(process.execPath, [importer, source, "김지언", "test-artist"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const output = path.join(root, "public");
    const manifest = JSON.parse(await readFile(path.join(output, "assets/works/test-artist/manifest.json"), "utf8"));
    assert.deepEqual(manifest.images.map(image => path.extname(image.src)), [".webp", ".gif", ".webp"]);
    const gif = manifest.images[1];
    assert.equal(gif.animated, true);
    assert.deepEqual(await readFile(path.join(output, gif.src)), await readFile(gifPath));
    assert.equal((await sharp(path.join(output, gif.src)).metadata()).pages, 2);
    assert.equal((await sharp(path.join(output, gif.stillSrc)).metadata()).pages ?? 1, 1);
    assert.match(gif.blurDataURL, /^data:image\/webp;base64,/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
