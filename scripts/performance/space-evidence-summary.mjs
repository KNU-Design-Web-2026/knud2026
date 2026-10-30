import assert from "node:assert/strict";

function median(values) {
  const sorted = values.filter(value => value !== null).toSorted((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeMeasurements(data) {
  assert.ok(Number.isInteger(data.runs) && data.runs > 0, "Invalid run count");
  assert.equal(data.results.length, data.runs * 4, "Incomplete condition grid");
  return ["normal", "slow"].flatMap(network => ["cold", "warm"].map(cache => {
    const rows = data.results.filter(row => row.network === network && row.cache === cache);
    assert.equal(rows.length, data.runs, `Incomplete ${network}/${cache}`);
    assert.deepEqual(rows.map(row => row.run).toSorted((a, b) => a - b), Array.from({ length: data.runs }, (_, i) => i + 1), "Duplicate/missing run");
    for (const row of rows) {
      assert.equal(typeof row.timedOut, "boolean");
      for (const value of [row.informationMs, row.readyMs]) assert.ok(value === null || (Number.isFinite(value) && value >= 0), "Invalid timing");
      assert.equal(row.readyMs === null, row.timedOut, "Timeout status contradicts readiness");
    }
    return { network, cache, samples: rows.length, timeouts: rows.filter(row => row.timedOut).length,
      informationSamples: rows.filter(row => row.informationMs !== null).length,
      informationMedianMs: median(rows.map(row => row.informationMs)),
      readySamples: rows.filter(row => row.readyMs !== null).length,
      readyMedianMs: median(rows.map(row => row.readyMs)) };
  }));
}
