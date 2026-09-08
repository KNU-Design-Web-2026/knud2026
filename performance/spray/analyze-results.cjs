const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const ROOT = __dirname;
const ARTIFACTS = path.resolve(
  process.env.SPRAY_ARTIFACTS_DIR || path.join(ROOT, "artifacts"),
);
const RESULTS_PATH = path.join(ARTIFACTS, "all-results.json");
const OUTPUT_DIR = path.resolve(
  process.env.SPRAY_REPORT_DIR || path.join(ROOT, "report"),
);
const REPORT_TARGET_URL = process.env.SPRAY_REPORT_TARGET_URL ||
  "https://www.2026-knud-graduation.com/";
const REPORT_GIT_SHA = process.env.SPRAY_REPORT_GIT_SHA || "unknown";
const REPORT_EXECUTION_MODE = process.env.SPRAY_REPORT_EXECUTION_MODE ||
  "headed Chrome";

const scenarioLabels = {
  idle: "Idle",
  click: "Click",
  "slow-drag": "Slow drag",
  "fast-drag": "Fast drag",
  decay: "Decay",
};

function round(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

function median(values) {
  const filtered = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!filtered.length) return null;
  const middle = Math.floor(filtered.length / 2);
  return filtered.length % 2
    ? filtered[middle]
    : (filtered[middle - 1] + filtered[middle]) / 2;
}

function range(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return { min: null, max: null };
  return { min: Math.min(...filtered), max: Math.max(...filtered) };
}

function summarizeMetric(runs, selector) {
  const values = runs.map(selector).filter((value) => Number.isFinite(value));
  const limits = range(values);
  return {
    median: round(median(values)),
    min: round(limits.min),
    max: round(limits.max),
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n") + "\n";
}

function metricMap(items) {
  return Object.fromEntries(items.map((item) => [item.name, item.value]));
}

function summarizeCleanMetric(filePath) {
  const result = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const before = metricMap(result.performanceMetrics.before);
  const after = metricMap(result.performanceMetrics.after);
  const names = [
    "TaskDuration",
    "ScriptDuration",
    "RecalcStyleDuration",
    "LayoutDuration",
    "JSHeapUsedSize",
  ];
  return {
    mode: result.mode,
    elapsedMs: result.elapsedMs,
    heapDeltaAfterGc: result.heap.deltaAfterGc,
    deltas: Object.fromEntries(
      names.map((name) => [name, round((after[name] ?? 0) - (before[name] ?? 0), 6)]),
    ),
  };
}

function parseCleanTrace(filePath) {
  const raw = zlib.gunzipSync(fs.readFileSync(filePath));
  const trace = JSON.parse(raw.toString("utf8"));
  const events = trace.traceEvents || [];
  const rendererThreads = new Set(
    events
      .filter(
        (event) =>
          event.ph === "M" &&
          event.name === "thread_name" &&
          event.args?.name === "CrRendererMain",
      )
      .map((event) => `${event.pid}:${event.tid}`),
  );

  const candidates = new Map();
  for (const key of rendererThreads) candidates.set(key, { taskDurationUs: 0, taskCount: 0 });

  for (const event of events) {
    const key = `${event.pid}:${event.tid}`;
    if (!candidates.has(key) || event.ph !== "X" || event.name !== "RunTask") continue;
    const candidate = candidates.get(key);
    candidate.taskDurationUs += event.dur || 0;
    candidate.taskCount += 1;
  }

  const selectedThread = [...candidates.entries()].sort(
    (a, b) => b[1].taskDurationUs - a[1].taskDurationUs,
  )[0]?.[0];
  const mainEvents = events.filter(
    (event) => `${event.pid}:${event.tid}` === selectedThread && event.ph === "X",
  );
  const profilerStartupEvents = mainEvents.filter(
    (event) => event.name === "CpuProfiler::StartProfiling",
  );
  const overlapsProfilerStartup = (event) => profilerStartupEvents.some(
    (profilerEvent) =>
      profilerEvent.ts < event.ts + (event.dur || 0) &&
      profilerEvent.ts + (profilerEvent.dur || 0) > event.ts,
  );
  const applicationRunTaskEvents = mainEvents.filter(
    (event) => event.name === "RunTask" && !overlapsProfilerStartup(event),
  );

  const names = [
    "RunTask",
    "FunctionCall",
    "EventDispatch",
    "FireAnimationFrame",
    "UpdateLayoutTree",
    "Layout",
    "PrePaint",
    "Paint",
  ];
  const summary = {};

  for (const name of names) {
    const matching = name === "RunTask"
      ? applicationRunTaskEvents
      : mainEvents.filter((event) => event.name === name);
    const durationsMs = matching.map((event) => (event.dur || 0) / 1000);
    summary[name] = {
      count: matching.length,
      totalMs: round(durationsMs.reduce((total, value) => total + value, 0)),
      maxMs: round(durationsMs.length ? Math.max(...durationsMs) : 0),
    };
  }

  const runTasks = applicationRunTaskEvents.map((event) => (event.dur || 0) / 1000);
  const gcEvents = mainEvents.filter((event) => /GC|Garbage/i.test(event.name));

  const threadNames = new Map(
    events
      .filter((event) => event.ph === "M" && event.name === "thread_name")
      .map((event) => [`${event.pid}:${event.tid}`, event.args?.name || "unknown"]),
  );

  const summarizeThreadRunTasks = (targetNames) => {
    const threadKeys = [...threadNames.entries()]
      .filter(([, name]) => targetNames.includes(name))
      .map(([key, name]) => ({ key, name }));
    const matchingKeys = new Set(threadKeys.map(({ key }) => key));
    const durationsMs = events
      .filter(
        (event) =>
          event.ph === "X" &&
          event.name === "RunTask" &&
          matchingKeys.has(`${event.pid}:${event.tid}`),
      )
      .map((event) => (event.dur || 0) / 1000);

    return {
      threads: threadKeys,
      count: durationsMs.length,
      totalMs: round(durationsMs.reduce((total, value) => total + value, 0)),
      p95Ms: round(percentile(durationsMs, 0.95)),
      maxMs: round(durationsMs.length ? Math.max(...durationsMs) : 0),
    };
  };

  return {
    file: path.relative(process.cwd(), filePath),
    selectedRendererThread: selectedThread,
    excludedProfilerStartupRunTasks: mainEvents.filter(
      (event) => event.name === "RunTask" && overlapsProfilerStartup(event),
    ).length,
    traceEventCount: events.length,
    rendererMainEventCount: mainEvents.length,
    longRunTasksOver50Ms: runTasks.filter((duration) => duration > 50).length,
    longestRunTaskMs: round(runTasks.length ? Math.max(...runTasks) : 0),
    gcEventCount: gcEvents.length,
    threadActivity: {
      gpuProcess: summarizeThreadRunTasks(["VizCompositorThread", "CrGpuMain"]),
      rendererCompositor: summarizeThreadRunTasks(["Compositor"]),
    },
    events: summary,
  };
}

function renderGroupedBarChart(groups, title, subtitle, unit, maxValue) {
  const width = 1200;
  const height = 700;
  const margin = { top: 120, right: 90, bottom: 120, left: 110 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const groupWidth = chartWidth / groups.length;
  const barWidth = Math.min(70, groupWidth * 0.26);
  const colors = { native: "#15A9ED", "4x": "#FF5A36" };
  const dataMax = Math.max(
    ...groups.flatMap((group) => [group.native || 0, group["4x"] || 0]),
  );
  const chartMax = Math.max(maxValue, Math.ceil((dataMax * 1.18) / 5) * 5);
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#F7F7F2"/>`,
    `<text x="${margin.left}" y="54" font-family="Pretendard, Arial, sans-serif" font-size="34" font-weight="700" fill="#111">${title}</text>`,
    `<text x="${margin.left}" y="88" font-family="Pretendard, Arial, sans-serif" font-size="18" fill="#555">${subtitle}</text>`,
  ];

  for (let index = 0; index <= 5; index += 1) {
    const value = (chartMax / 5) * index;
    const y = margin.top + chartHeight - (value / chartMax) * chartHeight;
    lines.push(`<line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" stroke="#D8D8D2"/>`);
    lines.push(`<text x="${margin.left - 16}" y="${y + 6}" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#666">${round(value, 1)}${unit}</text>`);
  }

  groups.forEach((group, groupIndex) => {
    const centerX = margin.left + groupWidth * groupIndex + groupWidth / 2;
    ["native", "4x"].forEach((mode, modeIndex) => {
      const value = group[mode] || 0;
      const barHeight = (value / chartMax) * chartHeight;
      const x = centerX + (modeIndex === 0 ? -barWidth - 6 : 6);
      const y = margin.top + chartHeight - barHeight;
      lines.push(`<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="${colors[mode]}"/>`);
      lines.push(`<text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111">${round(value, 1)}${unit}</text>`);
    });
    lines.push(`<text x="${centerX}" y="${margin.top + chartHeight + 44}" text-anchor="middle" font-family="Pretendard, Arial, sans-serif" font-size="19" fill="#111">${group.label}</text>`);
  });

  lines.push(`<rect x="${width - 310}" y="42" width="18" height="18" rx="4" fill="${colors.native}"/>`);
  lines.push(`<text x="${width - 282}" y="57" font-family="Arial, sans-serif" font-size="17">Native</text>`);
  lines.push(`<rect x="${width - 190}" y="42" width="18" height="18" rx="4" fill="${colors["4x"]}"/>`);
  lines.push(`<text x="${width - 162}" y="57" font-family="Arial, sans-serif" font-size="17">4× CPU</text>`);
  lines.push(`</svg>`);
  return lines.join("\n");
}

function renderScatterChart(points) {
  const width = 1200;
  const height = 720;
  const margin = { top: 125, right: 100, bottom: 110, left: 120 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maxX = Math.ceil((Math.max(...points.map((point) => point.x)) * 1.08) / 100) * 100;
  const maxY = Math.ceil((Math.max(...points.map((point) => point.y)) * 1.15) / 5) * 5;
  const colors = { native: "#15A9ED", "4x": "#FF5A36" };
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#F7F7F2"/>`,
    `<text x="${margin.left}" y="54" font-family="Pretendard, Arial, sans-serif" font-size="34" font-weight="700" fill="#111">활성 스탬프와 렌더 비용의 관계</text>`,
    `<text x="${margin.left}" y="88" font-family="Pretendard, Arial, sans-serif" font-size="18" fill="#555">Run 02~05 중앙값 · 자동화된 동일 경로</text>`,
  ];

  for (let index = 0; index <= 5; index += 1) {
    const xValue = (maxX / 5) * index;
    const x = margin.left + (xValue / maxX) * chartWidth;
    lines.push(`<line x1="${x}" x2="${x}" y1="${margin.top}" y2="${margin.top + chartHeight}" stroke="#E0E0DA"/>`);
    lines.push(`<text x="${x}" y="${margin.top + chartHeight + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">${round(xValue, 0)}</text>`);
    const yValue = (maxY / 5) * index;
    const y = margin.top + chartHeight - (yValue / maxY) * chartHeight;
    lines.push(`<line x1="${margin.left}" x2="${margin.left + chartWidth}" y1="${y}" y2="${y}" stroke="#E0E0DA"/>`);
    lines.push(`<text x="${margin.left - 18}" y="${y + 6}" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#666">${round(yValue, 1)}ms</text>`);
  }

  for (const point of points) {
    const x = margin.left + (point.x / maxX) * chartWidth;
    const y = margin.top + chartHeight - (point.y / maxY) * chartHeight;
    const rightAligned = point.x > maxX * 0.72;
    const labelX = x + (rightAligned ? -17 : 17);
    const labelAnchor = rightAligned ? "end" : "start";
    const labelY = y + (point.label === "Decay" ? 27 : point.label === "Click" && point.mode === "4x" ? 27 : -12);
    lines.push(`<circle cx="${x}" cy="${y}" r="13" fill="${colors[point.mode]}" stroke="#111" stroke-width="2"/>`);
    lines.push(`<text x="${labelX}" y="${labelY}" text-anchor="${labelAnchor}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111">${point.label} · ${point.mode}</text>`);
  }

  lines.push(`<text x="${margin.left + chartWidth / 2}" y="${height - 28}" text-anchor="middle" font-family="Pretendard, Arial, sans-serif" font-size="18" fill="#111">Peak estimated active stamps</text>`);
  lines.push(`<text x="30" y="${margin.top + chartHeight / 2}" transform="rotate(-90 30 ${margin.top + chartHeight / 2})" text-anchor="middle" font-family="Pretendard, Arial, sans-serif" font-size="18" fill="#111">Render duration p95</text>`);
  lines.push(`</svg>`);
  return lines.join("\n");
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  const measuredRuns = results.filter((result) => !result.warmup);
  const grouped = [];

  for (const mode of ["native", "4x"]) {
    for (const scenario of ["idle", "click", "slow-drag", "fast-drag", "decay"]) {
      const runs = measuredRuns.filter(
        (result) => result.mode === mode && result.scenario === scenario,
      );
      grouped.push({
        mode,
        scenario,
        runCount: runs.length,
        pointerMoves: summarizeMetric(runs, (run) => run.metrics.pointerMoves),
        canvasFrames: summarizeMetric(runs, (run) => run.metrics.canvasFrames),
        peakEstimatedActiveStamps: summarizeMetric(
          runs,
          (run) => run.metrics.peakEstimatedActiveStamps,
        ),
        renderDurationP95Ms: summarizeMetric(
          runs,
          (run) => run.metrics.renderDurationP95Ms,
        ),
        frameIntervalP95Ms: summarizeMetric(
          runs,
          (run) => run.metrics.frameIntervalP95Ms,
        ),
        frameIntervalsOver20Ms: summarizeMetric(
          runs,
          (run) => run.metrics.frameIntervalsOver20Ms,
        ),
        longTaskCount: summarizeMetric(runs, (run) => run.metrics.longTaskCount),
        heapDeltaAfterGc: summarizeMetric(runs, (run) => run.heap.deltaAfterGc),
      });
    }
  }

  const runRows = results.map((result) => ({
    mode: result.mode,
    scenario: result.scenario,
    run: result.run,
    warmup: result.warmup,
    traced: result.traced,
    pointerMoves: result.metrics.pointerMoves,
    canvasFrames: result.metrics.canvasFrames,
    peakEstimatedActiveStamps: result.metrics.peakEstimatedActiveStamps,
    renderDurationP50Ms: result.metrics.renderDurationP50Ms,
    renderDurationP95Ms: result.metrics.renderDurationP95Ms,
    renderDurationMaxMs: result.metrics.renderDurationMaxMs,
    frameIntervalP50Ms: result.metrics.frameIntervalP50Ms,
    frameIntervalP95Ms: result.metrics.frameIntervalP95Ms,
    frameIntervalMaxMs: result.metrics.frameIntervalMaxMs,
    frameIntervalsOver20Ms: result.metrics.frameIntervalsOver20Ms,
    longTaskCount: result.metrics.longTaskCount,
    longTaskMaxMs: result.metrics.longTaskMaxMs,
    heapDeltaAfterGc: result.heap.deltaAfterGc,
  }));

  const summaryRows = grouped.map((group) => ({
    mode: group.mode,
    scenario: group.scenario,
    runs: group.runCount,
    pointerMovesMedian: group.pointerMoves.median,
    canvasFramesMedian: group.canvasFrames.median,
    peakActiveMedian: group.peakEstimatedActiveStamps.median,
    peakActiveRange: `${group.peakEstimatedActiveStamps.min ?? ""}~${group.peakEstimatedActiveStamps.max ?? ""}`,
    renderP95MedianMs: group.renderDurationP95Ms.median,
    renderP95RangeMs: `${group.renderDurationP95Ms.min ?? ""}~${group.renderDurationP95Ms.max ?? ""}`,
    intervalP95MedianMs: group.frameIntervalP95Ms.median,
    intervalP95RangeMs: `${group.frameIntervalP95Ms.min ?? ""}~${group.frameIntervalP95Ms.max ?? ""}`,
    intervalsOver20Median: group.frameIntervalsOver20Ms.median,
    longTasksMedian: group.longTaskCount.median,
    longTasksRange: `${group.longTaskCount.min ?? ""}~${group.longTaskCount.max ?? ""}`,
    heapDeltaAfterGcMedian: group.heapDeltaAfterGc.median,
  }));

  const cleanNativeMetric = summarizeCleanMetric(
    path.join(ARTIFACTS, "clean", "spray-fast-drag-native-run-01.metrics.json"),
  );
  const clean4xMetric = summarizeCleanMetric(
    path.join(ARTIFACTS, "clean", "spray-fast-drag-4x-run-01.metrics.json"),
  );
  const cleanNativeTrace = parseCleanTrace(
    path.join(ARTIFACTS, "clean", "spray-fast-drag-native-run-01.trace.json.gz"),
  );
  const clean4xTrace = parseCleanTrace(
    path.join(ARTIFACTS, "clean", "spray-fast-drag-4x-run-01.trace.json.gz"),
  );

  fs.writeFileSync(path.join(OUTPUT_DIR, "runs.csv"), toCsv(runRows));
  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.csv"), toCsv(summaryRows));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "summary.json"),
    JSON.stringify({ grouped, clean: { metrics: [cleanNativeMetric, clean4xMetric], traces: [cleanNativeTrace, clean4xTrace] } }, null, 2),
  );

  const activeGroups = grouped.filter((group) => group.scenario !== "idle");
  const renderGroups = ["click", "slow-drag", "fast-drag", "decay"].map((scenario) => ({
    label: scenarioLabels[scenario],
    native: grouped.find((group) => group.mode === "native" && group.scenario === scenario).renderDurationP95Ms.median,
    "4x": grouped.find((group) => group.mode === "4x" && group.scenario === scenario).renderDurationP95Ms.median,
  }));
  const intervalGroups = ["click", "slow-drag", "fast-drag", "decay"].map((scenario) => ({
    label: scenarioLabels[scenario],
    native: grouped.find((group) => group.mode === "native" && group.scenario === scenario).frameIntervalP95Ms.median,
    "4x": grouped.find((group) => group.mode === "4x" && group.scenario === scenario).frameIntervalP95Ms.median,
  }));
  const scatterPoints = activeGroups
    .filter((group) => group.peakEstimatedActiveStamps.median > 0)
    .map((group) => ({
      mode: group.mode,
      label: scenarioLabels[group.scenario],
      x: group.peakEstimatedActiveStamps.median,
      y: group.renderDurationP95Ms.median,
    }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "render-p95-comparison.svg"),
    renderGroupedBarChart(
      renderGroups,
      "Canvas 스프레이 렌더 시간 p95",
      "Run 02~05 중앙값 · 값이 낮을수록 좋음",
      "ms",
      20,
    ),
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "frame-interval-p95-comparison.svg"),
    renderGroupedBarChart(
      intervalGroups,
      "Canvas 프레임 간격 p95",
      "Run 02~05 중앙값 · 60Hz 예산 16.7ms",
      "ms",
      30,
    ),
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "active-stamps-vs-render-p95.svg"),
    renderScatterChart(scatterPoints),
  );

  const tableRows = summaryRows.map((row) =>
    `| ${row.mode} | ${scenarioLabels[row.scenario]} | ${row.pointerMovesMedian ?? "-"} | ${row.peakActiveMedian ?? "-"} | ${row.renderP95MedianMs ?? "-"} | ${row.intervalP95MedianMs ?? "-"} | ${row.longTasksRange} |`,
  );
  const nativeFast = grouped.find((group) => group.mode === "native" && group.scenario === "fast-drag");
  const cpuFast = grouped.find((group) => group.mode === "4x" && group.scenario === "fast-drag");
  const nativeSlow = grouped.find((group) => group.mode === "native" && group.scenario === "slow-drag");
  const cpuSlow = grouped.find((group) => group.mode === "4x" && group.scenario === "slow-drag");
  const markdown = `# Canvas 스프레이 배포 환경 성능 측정 결과

## 결론 요약

- Idle에서는 Native와 4× CPU 모두 스프레이 Canvas 프레임이 0이었다. 입력이 없을 때 rAF 루프를 지속 실행하지 않는다.
- Native Slow drag의 렌더 p95 중앙값은 ${nativeSlow.renderDurationP95Ms.median}ms, Fast drag는 ${nativeFast.renderDurationP95Ms.median}ms였다.
- Native에서 Slow와 Fast의 포인터 이동 수는 각각 ${nativeSlow.pointerMoves.median}회와 ${nativeFast.pointerMoves.median}회로 비슷하지만, 활성 스탬프 추정 최댓값 중앙값은 ${nativeSlow.peakEstimatedActiveStamps.median}개에서 ${nativeFast.peakEstimatedActiveStamps.median}개로 증가했다.
- 4× CPU Fast drag의 렌더 p95 중앙값은 ${cpuFast.renderDurationP95Ms.median}ms, 프레임 간격 p95 중앙값은 ${cpuFast.frameIntervalP95Ms.median}ms였다.
- 4× CPU Slow drag의 렌더 p95 중앙값은 ${cpuSlow.renderDurationP95Ms.median}ms였다. 입력 이벤트 수보다 활성 스탬프를 반복해서 그리는 비용이 주요 병목 후보라는 가설과 일치한다.
- Decay 시나리오에서 입력 종료 후 스탬프가 만료되면 Canvas 프레임 증가도 멈췄다. 무한 rAF 실행 징후는 확인되지 않았다.

## 측정 환경

- 측정 URL: ${REPORT_TARGET_URL}
- Git SHA: ${REPORT_GIT_SHA}
- Chrome: 151.0.7922.175 arm64
- Device: MacBook Pro 14-inch, Apple M3, 24GB
- OS: macOS 14.6 (23G80)
- Viewport: 1512×982
- DPR: 2
- Cache: Warm
- Power: AC 연결, 충전 중
- CPU 조건: Native / Chrome DevTools 4× slowdown

## 측정 방식

- 실제 Google Chrome 바이너리를 ${REPORT_EXECUTION_MODE}로 실행했다.
- Playwright CDP mouse 입력으로 동일한 좌우 경로를 반복했다.
- 각 조건을 5회 실행하고 Run 01을 워밍업으로 제외했다.
- Run 02~05의 중앙값과 범위를 대표값으로 사용했다.
- 내부 원인 비교용 50회에는 rAF와 Canvas API의 최소 계측 래핑이 포함됐다.
- 별도로 계측 래핑을 끈 Native/4× Fast-drag Clean trace를 수집했다.

## 반복 측정 결과

| CPU | 시나리오 | Pointer moves | Peak active stamps | Render p95 | Frame interval p95 | Long Tasks 범위 |
|---|---|---:|---:|---:|---:|---:|
${tableRows.join("\n")}

## Clean Fast-drag trace

### Native

- 전체 경과 시간: ${cleanNativeMetric.elapsedMs}ms
- Main thread RunTask 최댓값: ${cleanNativeTrace.longestRunTaskMs}ms
- 50ms 초과 RunTask: ${cleanNativeTrace.longRunTasksOver50Ms}회
- 분석 제외: trace 시작 시 CpuProfiler::StartProfiling과 겹친 RunTask ${cleanNativeTrace.excludedProfilerStartupRunTasks}회
- Performance TaskDuration 증가량: ${cleanNativeMetric.deltas.TaskDuration}s
- Performance ScriptDuration 증가량: ${cleanNativeMetric.deltas.ScriptDuration}s
- GPU 프로세스 관련 thread RunTask 합계/p95/최댓값: ${cleanNativeTrace.threadActivity.gpuProcess.totalMs}ms / ${cleanNativeTrace.threadActivity.gpuProcess.p95Ms}ms / ${cleanNativeTrace.threadActivity.gpuProcess.maxMs}ms
- Renderer Compositor RunTask 합계/p95/최댓값: ${cleanNativeTrace.threadActivity.rendererCompositor.totalMs}ms / ${cleanNativeTrace.threadActivity.rendererCompositor.p95Ms}ms / ${cleanNativeTrace.threadActivity.rendererCompositor.maxMs}ms

### 4× CPU

- 전체 경과 시간: ${clean4xMetric.elapsedMs}ms
- Main thread RunTask 최댓값: ${clean4xTrace.longestRunTaskMs}ms
- 50ms 초과 RunTask: ${clean4xTrace.longRunTasksOver50Ms}회
- 분석 제외: trace 시작 시 CpuProfiler::StartProfiling과 겹친 RunTask ${clean4xTrace.excludedProfilerStartupRunTasks}회
- Performance TaskDuration 증가량: ${clean4xMetric.deltas.TaskDuration}s
- Performance ScriptDuration 증가량: ${clean4xMetric.deltas.ScriptDuration}s
- GPU 프로세스 관련 thread RunTask 합계/p95/최댓값: ${clean4xTrace.threadActivity.gpuProcess.totalMs}ms / ${clean4xTrace.threadActivity.gpuProcess.p95Ms}ms / ${clean4xTrace.threadActivity.gpuProcess.maxMs}ms
- Renderer Compositor RunTask 합계/p95/최댓값: ${clean4xTrace.threadActivity.rendererCompositor.totalMs}ms / ${clean4xTrace.threadActivity.rendererCompositor.p95Ms}ms / ${clean4xTrace.threadActivity.rendererCompositor.maxMs}ms

위 GPU 관련 수치는 Chrome trace 안의 GPU Process·compositor thread에서 관찰한 작업 횟수와 실행 시간이다. 하드웨어 GPU 전체 사용률(%)은 아니며, 화면 합성과 GPU 프로세스 활동을 뒷받침하는 trace 근거로만 사용한다.

## 해석

### H1. 입력이 없을 때 rAF 루프가 멈추는가?

지지된다. Idle 5회씩에서 스프레이 Canvas의 clearRect와 렌더 프레임이 발생하지 않았다.

### H2. Fast drag 비용은 포인터 이벤트 수보다 활성 스탬프 수의 영향을 크게 받는가?

현재 결과는 이 가설과 일치한다. Slow와 Fast의 포인터 이벤트 수 차이는 작지만, Fast에서 활성 스탬프와 렌더 p95가 함께 크게 증가했다. 다만 상관관계만으로 인과를 확정하지 않고, 다음 최적화 단계에서 스탬프 수 제한 또는 캐싱을 단일 변수로 적용해 재검증한다.

### H3. 거리 기반 보간은 빠른 이동에서 작업량을 늘리는가?

현재 결과와 코드 구조는 이 가설을 지지한다. 동일한 포인터 이동 횟수에서도 이동 거리와 속도가 큰 Fast 경로가 더 많은 동시 활성 스탬프를 만들었다.

### H4. 입력이 끝난 뒤 rAF 루프가 종료되는가?

지지된다. Decay 시나리오에서 스탬프가 만료된 이후 추가 Canvas 프레임이 관찰되지 않았다. 다만 만료 전 약 2.4초 동안은 누적된 스탬프 전체를 다시 그리므로 4× CPU에서 높은 렌더 비용이 유지됐다.

## 측정 한계

- CDP의 자동화된 포인터 경로는 재현성이 높지만 실제 사용자의 물리 마우스 샘플링과 완전히 같지는 않다.
- 활성 스탬프 수는 현재 구현의 스탬프당 파티클 82개와 프레임별 arc 호출 수를 이용한 추정치다.
- 내부 계측 래핑은 작은 오버헤드를 추가할 수 있으므로 절대값은 Clean trace와 함께 해석해야 한다.
- 4× CPU slowdown은 현재 Mac CPU를 상대적으로 느리게 만든 스트레스 조건이며 실제 저사양 기기와 동일하지 않다.
- Performance 패널의 CPU 개요는 Chrome main thread 작업 범주를 시각화한 것이며 시스템 전체 CPU 사용률이 아니다.
- GPU track과 GPU 프로세스 thread 시간은 GPU 경로의 활동 증거이지 하드웨어 GPU 사용률(%)이 아니다. GPU 사용률이 필요하면 Instruments의 Metal System Trace처럼 별도 시스템 계측을 같은 실험으로 수행해야 한다.

## 다음 최적화 실험 후보

1. 최대 활성 스탬프 수 또는 프레임당 생성 스탬프 수 제한
2. 스탬프 파티클을 매 프레임 개별 arc로 그리지 않고 사전 렌더링한 비트맵으로 캐싱
3. 스탬프 객체와 파티클 배열의 재사용으로 할당 및 GC 비용 축소
4. 입력 샘플과 거리 보간 정책 조정
5. DPR과 파티클 밀도의 동적 품질 단계 적용

각 최적화는 한 번에 하나씩 적용하고 동일한 50회 측정을 반복한다.

## 시각 자료

- [렌더 p95 비교](./render-p95-comparison.svg)
- [프레임 간격 p95 비교](./frame-interval-p95-comparison.svg)
- [활성 스탬프와 렌더 p95 관계](./active-stamps-vs-render-p95.svg)
- [Native DevTools CPU/GPU 타임라인](../evidence/devtools/screenshots/native-fast-drag-cpu-gpu-timeline.jpg)
- [4× DevTools CPU/GPU 타임라인](../evidence/devtools/screenshots/4x-fast-drag-cpu-gpu-timeline.jpg)
- [블로그용 핵심 지표 비교](../evidence/blog/headline-fast-drag-comparison.png)
- [최장 앱 작업 주변 1초 비교](../evidence/blog/focused-peak-trace-comparison.png)
- [최장 작업 self-time 구성](../evidence/blog/longest-task-breakdown.png)
- [Idle·Slow·Fast·Decay 설명용 trace](../evidence/blog/phase-trace-comparison.png)

## 원본 자료

- Run별 CSV: [runs.csv](./runs.csv)
- 요약 CSV: [summary.csv](./summary.csv)
- 전체 요약 JSON: [summary.json](./summary.json)
- 계측 원본: ../artifacts/all-results.json
- Clean Native trace: ../artifacts/clean/spray-fast-drag-native-run-01.trace.json.gz
- Clean 4× trace: ../artifacts/clean/spray-fast-drag-4x-run-01.trace.json.gz
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "results.md"), markdown);
  console.log(`보고서 생성 완료: ${path.join(OUTPUT_DIR, "results.md")}`);
}

main();
