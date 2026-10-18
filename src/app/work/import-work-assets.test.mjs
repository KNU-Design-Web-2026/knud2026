import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const importer = new URL("../../../scripts/import-work-assets.mjs", import.meta.url).pathname;

for (const scenario of [
  { artist: "김연수", folder: "포토폴리오", thumbs: ["김연수_Work.png", "김연수_SPACE.png", "김연수_상세.png"], pages: ["김연수_002.png", "김연수_001.png"], order: [1, 2] },
  { artist: "김민주", thumbs: ["work_썸네일.png", "space_썸네일.png", "상세페이지_썸네일.png"], pages: ["웹팀포트폴리오-10.png", "웹팀포트폴리오-02.png", "웹팀포트폴리오-01.png"], order: [1, 2, 10] },
  { artist: "이나경", thumbs: ["이나경 (work,space,상세페이지)-03.png", "이나경 (work,space,상세페이지)-02.png", "이나경 (work,space,상세페이지)-01.png"], pages: ["이나경 본문-02.png", "이나경 본문-01.png"], order: [1, 2] },
  { artist: "이서윤", thumbs: ["이서윤_Work.png", "이서윤_SPACE.png", "이서윤_상세.png"], pages: ["10.png", "2.png", "1.png"], order: [1, 2, 10] },
]) {
  test(`${scenario.artist} 제출 파일명에서도 용도별 썸네일과 숫자순 상세를 정확히 가져온다`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "knud-work-import-"));
    try {
      const source = path.join(root, "source");
      const artistRoot = path.join(source, `${scenario.artist}_웹work`.normalize("NFD"));
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
      const result = spawnSync(process.execPath, [importer, source, scenario.artist, "test-artist"], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      const manifest = JSON.parse(await readFile(path.join(root, "public/assets/works/test-artist/manifest.json"), "utf8"));
      assert.deepEqual([manifest.thumbnail.width, manifest.space.width, manifest.hero.width], [8, 12, 16]);
      assert.deepEqual(manifest.images.map(image => image.height), scenario.order.map(number => 20 + number));
      assert.ok(manifest.images.every(image => !image.sourceFile.includes("._")));
      for (const image of [manifest.thumbnail, manifest.space, manifest.hero, ...manifest.images]) {
        assert.match(image.blurDataURL, /^data:image\/webp;base64,/);
        const preview = await sharp(Buffer.from(image.blurDataURL.split(",")[1], "base64")).metadata();
        assert.ok(preview.width <= 16 && preview.height <= 16);
        assert.ok(image.blurDataURL.length < 1024);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
