import assert from "node:assert/strict";
import test from "node:test";
import { summarizeMeasurements } from "./space-evidence-summary.mjs";

const fixture = () => ({ runs: 2, results: ["normal", "slow"].flatMap(network => ["cold", "warm"].flatMap(cache => [1, 2].map(run => ({ network, cache, run, informationMs: run * 10, readyMs: run * 100, timedOut: false })))) });

test("조건별 표본 수와 짝수 표본의 중앙값을 원시 기록에서 계산한다", () => {
  const rows = summarizeMeasurements(fixture());
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { network: "normal", cache: "cold", samples: 2, timeouts: 0, informationSamples: 2, informationMedianMs: 15, readySamples: 2, readyMedianMs: 150 });
});
test("timeout과 null을 0ms 성공으로 바꾸지 않는다", () => {
  const data = fixture();
  Object.assign(data.results[0], { informationMs: null, readyMs: null, timedOut: true });
  const row = summarizeMeasurements(data)[0];
  assert.equal(row.timeouts, 1);
  assert.equal(row.informationSamples, 1);
  assert.equal(row.informationMedianMs, 20);
  assert.equal(row.readySamples, 1);
});
test("모든 정보가 누락된 조건의 중앙값은 null로 남긴다", () => {
  const data = fixture();
  for (const row of data.results) Object.assign(row, { informationMs: null, readyMs: null, timedOut: true });
  assert.equal(summarizeMeasurements(data)[0].readyMedianMs, null);
});
test("표본 누락, 중복 run, 비정상 값을 조용히 제외하지 않는다", () => {
  const missing = fixture(); missing.results.pop();
  assert.throws(() => summarizeMeasurements(missing));
  const duplicate = fixture(); duplicate.results[1].run = 1;
  assert.throws(() => summarizeMeasurements(duplicate));
  const invalid = fixture(); invalid.results[0].readyMs = -1;
  assert.throws(() => summarizeMeasurements(invalid));
});
