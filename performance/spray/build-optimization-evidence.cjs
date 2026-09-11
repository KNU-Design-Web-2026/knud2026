const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const BASELINE = JSON.parse(
  fs.readFileSync(path.join(ROOT, "report", "summary.json"), "utf8"),
);
const OPTIMIZED = JSON.parse(
  fs.readFileSync(path.join(ROOT, "optimized", "report", "summary.json"), "utf8"),
);
const VISUAL_COMPARISON = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "experiments",
      "08-spatial-sampling-20px",
      "visual-diff",
      "comparison.json",
    ),
    "utf8",
  ),
);
const VISUAL_REGION_AUDIT = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "experiments",
      "08-spatial-sampling-20px",
      "visual-diff",
      "baseline-comparison.json",
    ),
    "utf8",
  ),
);
const OUTPUT_DIR = path.join(ROOT, "optimized", "comparison");

const SCENARIOS = ["slow-drag", "fast-drag", "decay"];
const LABELS = {
  "slow-drag": "Slow drag",
  "fast-drag": "Fast drag",
  decay: "Decay",
};

function value(summary, mode, scenario, metric) {
  return summary.grouped.find(
    (item) => item.mode === mode && item.scenario === scenario,
  )[metric].median;
}

function percentChange(before, after) {
  return Math.round(((after - before) / before) * 1000) / 10;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function metricRecords(metric) {
  return ["native", "4x"].flatMap((mode) =>
    SCENARIOS.map((scenario) => {
      const before = value(BASELINE, mode, scenario, metric);
      const after = value(OPTIMIZED, mode, scenario, metric);
      return {
        mode,
        scenario,
        before,
        after,
        changePercent: percentChange(before, after),
      };
    }),
  );
}

function cleanMetric(mode, key) {
  const before = BASELINE.clean.metrics.find((item) => item.mode === mode).deltas[key];
  const after = OPTIMIZED.clean.metrics.find((item) => item.mode === mode).deltas[key];
  return { before, after, changePercent: percentChange(before, after) };
}

function renderChart(records, title, subtitle, outputName) {
  const width = 1400;
  const height = 760;
  const margin = { top: 150, right: 70, bottom: 110, left: 120 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const groupWidth = chartWidth / records.length;
  const barWidth = Math.min(60, groupWidth * 0.3);
  const maxValue = Math.ceil(Math.max(...records.flatMap((r) => [r.before, r.after])) * 1.2 / 5) * 5;
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#F7F7F2"/>`,
    `<text x="${margin.left}" y="58" font-family="Pretendard,Arial,sans-serif" font-size="38" font-weight="700" fill="#111">${title}</text>`,
    `<text x="${margin.left}" y="96" font-family="Pretendard,Arial,sans-serif" font-size="20" fill="#555">${subtitle}</text>`,
  ];

  for (let index = 0; index <= 5; index += 1) {
    const tick = (maxValue / 5) * index;
    const y = margin.top + chartHeight - (tick / maxValue) * chartHeight;
    lines.push(`<line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" stroke="#D7D7D1"/>`);
    lines.push(`<text x="${margin.left - 18}" y="${y + 6}" text-anchor="end" font-family="Arial,sans-serif" font-size="17" fill="#666">${round(tick, 1)}ms</text>`);
  }

  records.forEach((record, index) => {
    const center = margin.left + groupWidth * index + groupWidth / 2;
    const beforeHeight = (record.before / maxValue) * chartHeight;
    const afterHeight = (record.after / maxValue) * chartHeight;
    const beforeX = center - barWidth - 5;
    const afterX = center + 5;
    lines.push(`<rect x="${beforeX}" y="${margin.top + chartHeight - beforeHeight}" width="${barWidth}" height="${beforeHeight}" rx="7" fill="#909090"/>`);
    lines.push(`<rect x="${afterX}" y="${margin.top + chartHeight - afterHeight}" width="${barWidth}" height="${afterHeight}" rx="7" fill="#15A9ED"/>`);
    lines.push(`<text x="${beforeX + barWidth / 2}" y="${margin.top + chartHeight - beforeHeight - 10}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700">${record.before}</text>`);
    lines.push(`<text x="${afterX + barWidth / 2}" y="${margin.top + chartHeight - afterHeight - 10}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700">${record.after}</text>`);
    lines.push(`<text x="${center}" y="${margin.top + chartHeight + 36}" text-anchor="middle" font-family="Pretendard,Arial,sans-serif" font-size="16" fill="#111">${record.mode === "4x" ? "4×" : "Native"}</text>`);
    lines.push(`<text x="${center}" y="${margin.top + chartHeight + 60}" text-anchor="middle" font-family="Pretendard,Arial,sans-serif" font-size="16" fill="#555">${LABELS[record.scenario]}</text>`);
  });

  lines.push(`<rect x="${width - 360}" y="45" width="20" height="20" rx="4" fill="#909090"/><text x="${width - 330}" y="62" font-family="Pretendard,Arial,sans-serif" font-size="18">Before · 12px</text>`);
  lines.push(`<rect x="${width - 185}" y="45" width="20" height="20" rx="4" fill="#15A9ED"/><text x="${width - 155}" y="62" font-family="Pretendard,Arial,sans-serif" font-size="18">After · 20px</text>`);
  lines.push("</svg>");
  fs.writeFileSync(path.join(OUTPUT_DIR, outputName), `${lines.join("\n")}\n`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const render = metricRecords("renderDurationP95Ms");
const interval = metricRecords("frameIntervalP95Ms");
const clean = {
  native: {
    taskDuration: cleanMetric("native", "TaskDuration"),
    scriptDuration: cleanMetric("native", "ScriptDuration"),
  },
  "4x": {
    taskDuration: cleanMetric("4x", "TaskDuration"),
    scriptDuration: cleanMetric("4x", "ScriptDuration"),
  },
};
const visual = {
  seed: VISUAL_COMPARISON.seed,
  ssim: VISUAL_COMPARISON.ssim,
  psnrDb: VISUAL_COMPARISON.psnrAverageDb,
  activeStampCount: VISUAL_COMPARISON.rendererStats,
  imageSha256: VISUAL_COMPARISON.sha256,
  sprayRegionAverageBrightnessChangePercent:
    VISUAL_REGION_AUDIT.sprayRegion.averageBrightnessChangePercent,
  sprayRegionAverageSaturationChangePercent:
    VISUAL_REGION_AUDIT.sprayRegion.averageSaturationChangePercent,
  note: "파티클 수·반지름·알파·가장자리·드립 공식은 유지하고 공간 샘플 간격만 12px에서 20px로 변경",
};
const summary = {
  baselineGitSha: "cbc8a733e43ba43878bbae81aafa7f6b2f8bc0e9",
  optimizedGitSha: "c5c0f6a",
  executionMode: "headed Chrome",
  measuredRunsPerCondition: 4,
  warmupRunsPerCondition: 1,
  renderP95: render,
  frameIntervalP95: interval,
  clean,
  visual,
};
fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

const rows = render.map((item) => {
  const frame = interval.find((candidate) => candidate.mode === item.mode && candidate.scenario === item.scenario);
  return `| ${item.mode === "4x" ? "4×" : "Native"} | ${LABELS[item.scenario]} | ${item.before} → ${item.after}ms | ${Math.abs(item.changePercent)}% 감소 | ${frame.before} → ${frame.after}ms | ${Math.abs(frame.changePercent)}% 감소 |`;
});
const fastNative = render.find((item) => item.mode === "native" && item.scenario === "fast-drag");
const fast4x = render.find((item) => item.mode === "4x" && item.scenario === "fast-drag");
const markdown = `# Canvas 스프레이 최적화 전후 검증

## 결론

- Native Fast drag 렌더 p95: **${fastNative.before} → ${fastNative.after}ms (${Math.abs(fastNative.changePercent)}% 감소)**
- 4× CPU Fast drag 렌더 p95: **${fast4x.before} → ${fast4x.after}ms (${Math.abs(fast4x.changePercent)}% 감소)**
- 고정 seed 이미지 비교: **SSIM ${visual.ssim}**, 스프레이 영역 평균 밝기 변화 **${visual.sprayRegionAverageBrightnessChangePercent}%**
- Idle에서는 최적화 전후 모두 Canvas 프레임이 0으로 유지됐다.

## 동일 조건 비교

| CPU | 시나리오 | Render p95 | 변화 | Frame interval p95 | 변화 |
|---|---|---:|---:|---:|---:|
${rows.join("\n")}

대표값은 화면이 보이는 Chrome에서 조건별 5회 실행 후 첫 회를 워밍업으로 제외한 Run 02~05 중앙값이다. 뷰포트 1512×982, DPR 2, 동일 seed와 동일 CDP 포인터 경로를 사용했다.

## 무엇을 바꿨나

거리 보간 간격을 12px에서 20px로 조정해 빠른 드래그에서 동시에 살아 있는 스탬프를 약 733개에서 440개로 줄였다. 파티클 수, 반지름, 알파, 가장자리 질감, 드립 공식은 바꾸지 않았다. 추가로 프레임마다 만들던 배열과 좌표 객체를 제거하고, 포인터 좌표 변환용 Canvas 경계를 캐시했으며, 스탬프 내부의 삼각함수를 한 번만 계산하도록 정리했다.

## 시각 동등성

- 고정 seed: ${visual.seed}
- SSIM: ${visual.ssim}
- PSNR: ${visual.psnrDb}dB
- 스프레이 영역 평균 밝기: ${visual.sprayRegionAverageBrightnessChangePercent}%
- 스프레이 영역 평균 채도: ${visual.sprayRegionAverageSaturationChangePercent}%

SSIM은 완전 동일을 뜻하지 않는다. 이번 변경은 공간 샘플 수를 줄이는 최적화이므로 픽셀 차이는 존재한다. 그래서 전체 이미지 유사도뿐 아니라 스프레이 영역의 밝기·채도 변화, 실제 전후 영상도 함께 검토한다.

## 측정 신뢰성 메모

초기 최적화 측정은 실수로 headless Chrome에서 수행됐다. 이 결과는 \`optimized/report-headless\`에 격리하고 전후 결론에서 제외했다. 이후 기준 측정과 동일한 headed Chrome으로 50회를 다시 실행했다. 이 통제는 브라우저 실행 모드에 따른 프레임 스케줄링 차이를 최적화 효과로 잘못 해석하지 않기 위한 조치다.

## 증거 파일

- 전후 렌더 p95: [render-p95-before-after.svg](./render-p95-before-after.svg)
- 전후 프레임 간격 p95: [frame-interval-before-after.svg](./frame-interval-before-after.svg)
- 실제 전후 화면 영상: [spray-before-after.mp4](./spray-before-after.mp4)
- 최적화 Native Chrome Performance: [../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg](../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg)
- 최적화 4× Chrome Performance: [../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg](../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg)
- 원시 비교 JSON: [summary.json](./summary.json)
- 최적화 50회 요약: [../report/summary.json](../report/summary.json)
- 최적화 Run별 CSV: [../report/runs.csv](../report/runs.csv)
- 시각 전후·diff: [../../experiments/08-spatial-sampling-20px/visual-diff](../../experiments/08-spatial-sampling-20px/visual-diff)
- 기준 Clean trace: [../../artifacts/clean](../../artifacts/clean)
- 최적화 Clean trace: [../artifacts/clean](../artifacts/clean)
`;
fs.writeFileSync(path.join(OUTPUT_DIR, "results.md"), markdown);
renderChart(render, "Canvas 렌더 p95 · 최적화 전후", "동일한 headed Chrome · Run 02~05 중앙값 · 낮을수록 좋음", "render-p95-before-after.svg");
renderChart(interval, "프레임 간격 p95 · 최적화 전후", "60Hz 프레임 예산 16.7ms · 낮을수록 좋음", "frame-interval-before-after.svg");

const manifestPaths = [
  "optimized/artifacts/all-results.json",
  "optimized/artifacts/clean/spray-fast-drag-native-run-01.metrics.json",
  "optimized/artifacts/clean/spray-fast-drag-native-run-01.trace.json.gz",
  "optimized/artifacts/clean/spray-fast-drag-4x-run-01.metrics.json",
  "optimized/artifacts/clean/spray-fast-drag-4x-run-01.trace.json.gz",
  "optimized/report/runs.csv",
  "optimized/report/summary.json",
  "optimized/comparison/render-p95-before-after.svg",
  "optimized/comparison/frame-interval-before-after.svg",
  "optimized/comparison/spray-before-after.mp4",
  "optimized/evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg",
  "optimized/evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg",
  "experiments/08-spatial-sampling-20px/visual-diff/comparison.json",
  "experiments/08-spatial-sampling-20px/visual-diff/legacy-canvas.png",
  "experiments/08-spatial-sampling-20px/visual-diff/optimized-canvas.png",
  "experiments/08-spatial-sampling-20px/visual-diff/legacy-hero.png",
  "experiments/08-spatial-sampling-20px/visual-diff/optimized-hero.png",
  "experiments/08-spatial-sampling-20px/visual-diff/canvas-diff.png",
  "experiments/08-spatial-sampling-20px/visual-diff/legacy-capture.mp4",
  "experiments/08-spatial-sampling-20px/visual-diff/optimized-capture.mp4",
].filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)));
const manifest = {
  generatedAt: new Date().toISOString(),
  targetUrl: "http://127.0.0.1:3000/?spraySeed=20260908",
  visualTargetUrl: VISUAL_COMPARISON.targetUrl,
  branch: "perf/canvas-spray-optimization",
  baselineGitSha: summary.baselineGitSha,
  optimizedGitSha: summary.optimizedGitSha,
  chrome: "151.0.7922.175 arm64",
  viewport: { width: 1512, height: 982, devicePixelRatio: 2 },
  power: { source: "AC Power", charging: true },
  methodology: {
    executionMode: "headed Chrome",
    runsPerCondition: 5,
    warmupExcluded: 1,
    representativeStatistic: "Run 02~05 median",
    input: "Playwright CDP mouse input with fixed path and timing",
    visualSeed: 20260908,
    visualComparison:
      "same checkout, deterministic seed/input, sprayRenderer=legacy(12px)|optimized(20px)",
  },
  files: manifestPaths.map((relativePath) => {
    const absolutePath = path.join(ROOT, relativePath);
    const contents = fs.readFileSync(absolutePath);
    return {
      path: relativePath,
      bytes: contents.byteLength,
      sha256: crypto.createHash("sha256").update(contents).digest("hex"),
    };
  }),
};
fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`최적화 비교 증거 생성 완료: ${OUTPUT_DIR}`);
