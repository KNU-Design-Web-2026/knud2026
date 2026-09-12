import assert from "node:assert/strict";
import test from "node:test";
import { createStampGroups } from "./spray-stamp-groups.ts";

const stamps = (n) => Array.from({ length: n }, (_, i) => ({ createdAt: i, drip: null }));
const stable = (stamp) => !stamp.drip;

test("only sealed contiguous groups collapse; the growing tail stays individual", () => {
  const groups = createStampGroups(), input = stamps(65);
  const result = groups.select(input, stable);
  assert.deepEqual(result.map(g => [g.stamps.length, g.cacheable]), [[32, true], [32, true], [1, false]]);
  assert.deepEqual(result.flatMap(g => g.stamps), input);
});

test("a new drip or fade invalidates its group without moving it above later paint", () => {
  const groups = createStampGroups(), input = stamps(64);
  groups.select(input, stable);
  input[12].drip = {};
  assert.deepEqual(groups.select(input, stable).map(g => g.cacheable), [false, true]);
  assert.deepEqual(groups.select(input, s => !s.drip && s.createdAt > 40).map(g => g.cacheable), [false, false]);
  assert.deepEqual(groups.select(input, stable).flatMap(g => g.stamps), input);
});

test("expiring leading stamps does not regroup and rebake the remaining sealed groups", () => {
  const groups = createStampGroups(), input = stamps(64);
  const old = groups.select(input, stable);
  const next = groups.select(input.slice(5), stable);
  assert.equal(next[1].id, old[1].id);
  assert.deepEqual(next.map(g => [g.stamps.length, g.cacheable]), [[27, false], [32, true]]);
  groups.clear();
  assert.equal(groups.select(stamps(32), stable)[0].cacheable, true);
});
