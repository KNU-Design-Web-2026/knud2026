import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

export async function packageEvidence(output) {
  const manifest = JSON.parse(await readFile(resolve(output, "manifest.json")));
  assert.ok(manifest.cases.every(c => c.passed), "Do not publish an incomplete recording bundle as passing");
  // Migrate any early capture's source copies to inert text, preserving content.
  async function preserveSources(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await preserveSources(path);
      else if (/\.(tsx?|mjs|json)$/.test(entry.name)) await rename(path, `${path}.txt`);
    }
  }
  await preserveSources(resolve(output, "source"));
  const toolsDir = resolve(output, "reproduce");
  await mkdir(toolsDir, { recursive: true });
  for (const name of ["record-space-evidence.mjs", "package-space-evidence.mjs", "space-evidence-summary.mjs", "measure-space-preview.mjs", "compare-space-visuals.mjs"]) {
    await cp(new URL(`./${name}`, import.meta.url), resolve(toolsDir, `${name}.txt`));
  }
  for (const file of ["playwright.config.ts", "eslint.config.mjs", "package.json", "pnpm-lock.yaml"]) {
    await cp(resolve(file), resolve(toolsDir, `${file}.txt`));
  }
  let hasFfmpeg = false;
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    hasFfmpeg = true;
  }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const verification = [];
  for (const item of manifest.cases) {
    const dir = resolve(output, item.name);
    const mp4 = resolve(dir, "recording.mp4");
    if (hasFfmpeg) {
      const exists = await stat(mp4).catch(error => { if (error.code === "ENOENT") return null; throw error; });
      if (!exists) execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-n", "-i", resolve(dir, "recording.webm"), "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", mp4]);
      const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height:format=duration", "-of", "json", mp4], { encoding: "utf8" }));
      assert.equal(probe.streams[0].width, item.viewport[0]);
      assert.equal(probe.streams[0].height, item.viewport[1]);
      assert.ok(Number(probe.format.duration) > 1);
      verification.push({ case: item.name, ...probe });
    }
  }
  await writeFile(resolve(output, "video-verification.json"), JSON.stringify({ ffmpegAvailable: hasFfmpeg, videos: verification }, null, 2));
  const rows = [];
  for (const label of ["baseline", "candidate"]) {
    const metrics = JSON.parse(await readFile(resolve(output, "metrics", `${label}.json`)));
    for (const row of metrics.results) rows.push([label, row.network, row.cache, row.run, row.informationMs ?? "", row.readyMs ?? "", row.timedOut].join(","));
  }
  await writeFile(resolve(output, "metrics/samples.csv"), `version,network,cache,run,information_ms,ready_ms,timed_out\n${rows.join("\n")}\n`);
  const links = manifest.cases.map(c => `| ${c.name} | [${hasFfmpeg ? "MP4" : "WebM"}](./${c.name}/recording.${hasFfmpeg ? "mp4" : "webm"}) | [trace](./${c.name}/trace.zip) | [실행 기록](./${c.name}/observations.json) |`).join("\n");
  const hasReport = await stat(resolve(output, "e2e-report/index.html")).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  const reportNote = hasReport ? "추가로 e2e-report/에 녹화 실행의 HTML 보고서를 고정 복사했습니다. 성공·실패·skip 수는 해당 보고서와 보존한 console log에서 확인하세요. Playwright는 page fixture 생성 후 skip되는 조합에도 빈 녹화를 남길 수 있어, 영상 파일 개수를 성공한 검사 수로 세지 마세요. 보고서는 pnpm exec playwright show-report /절대/경로/e2e-report 로 열 수 있습니다." : "";
  await writeFile(resolve(output, "README.md"), `# SPACE 검증 증거 묶음

촬영: ${manifest.capturedAt} (UTC), 표시 시간대 Asia/Seoul. 브라우저 Chromium ${manifest.browser}, 1920×1080/DPR1. 로컬 production build이며 현장 촬영이나 운영 CDN 검증이 아닙니다.

## 바로 보기

| 시나리오 | 영상 | 추적 | 동작·상태 기록 |
| --- | --- | --- | --- |
${links}

- slow-cold: CDP 0.4Mbps download / 0.2Mbps upload / latency400ms, 지도 선택 구간만 제한. 요청 interception 없음. 각 버전 새 context. early/ready PNG가 있습니다.
- held-8s: 대상 이미지 응답을 **인위적으로 8초 보류**한 기능 검증. 실제 현장 대기시간 또는 일반적인 네트워크 지연 수치가 아닙니다. pending/ready PNG가 있습니다. 같은 조건의 두 버전을 비교하세요.
- error-retry: 첫 요청 abort, 재시도 요청 3초 보류한 **합성 오류** 검사. 정보 유지 → 키보드 재시도 → 고화질 준비 → 상세 이동을 기록했습니다. error/retry-loading/ready/detail-navigation PNG가 있습니다.
- *-detail.png는 팝업 크롭, 나머지 PNG는 화면 전체입니다. 원본 WebM과 등속 MP4를 함께 보존했습니다. 화면 내용이나 숫자 자막을 합성하지 않았습니다.

## 지표와 녹화의 관계

${reportNote}

[baseline 원시 측정](./metrics/baseline.json), [candidate 원시 측정](./metrics/candidate.json), [80개 표본 CSV](./metrics/samples.csv), [조건별 중앙값·누락·timeout 집계](./metrics/summary.json)를 함께 보존했습니다. 이 수치는 **녹화·trace 없이 이전에 수행한 80회 측정**입니다. 촬영 중 시간은 성능 표본에 합치지 않습니다. 녹화는 행동과 표시 상태를 보여주는 보조 증거이고 영상 한 개를 중앙값 실행으로 표현하지 않습니다.

기존 지표는 작품 정보 표시와 고화질 준비를 구분합니다. 저속은 현장을 추정한 통제 조건이지 현장 네트워크 실측값이 아닙니다. 사람의 인지율·만족도·이탈률·현장 해결을 측정한 자료가 아닙니다. 신규 source hash가 없는 과거 측정에 현재 hash를 소급 적용하지 않았습니다.

## 출처와 보존

[manifest](./manifest.json)에 build ID, HEAD, 미커밋 여부, 현재 촬영 소스의 SHA-256을 기록했습니다. source/는 촬영 시점의 핵심 소스 텍스트이며 전체 저장소/의존성을 포함하지 않습니다. reproduce/에는 촬영·측정 스크립트와 설정을 텍스트로 보존했습니다. 저장소에서 복원해 실행하려면 .txt를 제거해야 합니다. baseline은 명시한 기준 커밋(기본5328fc2)의 해당 소스와 일치하는지 검사합니다. 촬영 전후 source hash도 확인합니다. checksums.json은 이 파일과 영상/trace/측정/소스의 해시 목록입니다. 체크섬 자체는 자가 해시하지 않습니다.

영상은 무음이며 키보드 focus로 작품을 선택했습니다. 녹화 전 지도 위치를 스크롤했으므로 과거 벤치마크의 정확한 실행 영상은 아닙니다. ready까지 기다린 뒤 비교한 기존 6개 화면 폭의 시각 비교는 별도 artifacts/space-preview/visual/에 남아 있습니다.

## 재현

저장소 루트에서 두 production 서버(기준3101, 수정3102)를 준비한 뒤:

~~~sh
pnpm evidence:space --baseline-root=/절대/경로/독립기준본 --baseline-ref=5328fc2
SPACE_CAPTURE=1 pnpm exec playwright test --project=chromium
pnpm exec playwright show-trace /절대/경로/시나리오/trace.zip
~~~

첫 명령은 매번 날짜가 붙은 새 폴더를 생성합니다. 두 번째는 기존 E2E에서 성공·실패 모두 video/trace/screenshot을 보존하는 선택 모드이며 기본 벤치마크는 바꾸지 않습니다. ffmpeg/ffprobe가 있으면 MP4와 해상도·재생시간 검사도 만듭니다. 없으면 원본 WebM을 사용합니다. 기록은 자동으로 GitHub에 업로드되지 않습니다.
`);
  const hashes = [];
  async function inventory(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await inventory(path);
      else if (path !== resolve(output, "checksums.json")) hashes.push({ path: relative(output, path), sha256: createHash("sha256").update(await readFile(path)).digest("hex") });
    }
  }
  await inventory(output);
  await writeFile(resolve(output, "checksums.json"), JSON.stringify(hashes, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.ok(process.argv[2], "Supply an evidence bundle directory");
  await packageEvidence(resolve(process.argv[2]));
}
