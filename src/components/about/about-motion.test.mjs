import assert from "node:assert/strict";
import test from "node:test";
import { advanceMotion, revealProgress } from "./about-motion-math.ts";

test("scroll position keeps intermediate reveal states in both directions", () => {
  assert.equal(revealProgress(633, 168, 633), 0);
  assert.equal(revealProgress(549, 168, 633), 0.5);
  assert.equal(revealProgress(465, 168, 633), 1);
  assert.equal(revealProgress(-200, 168, 633), 1);
  assert.equal(revealProgress(549, 168, 633), 0.5);
});

test("spring eases toward the target and preserves motion on reversal", () => {
  const entering = advanceMotion(0, 0, 1, 0.25);
  assert.ok(entering.value > 0.7 && entering.value < 0.8);
  const reversed = advanceMotion(entering.value, entering.velocity, 0, 0.001);
  assert.ok(Math.abs(reversed.value - entering.value) < 0.01);
  assert.ok(reversed.velocity > 0, "velocity must not reset at the direction change");
  const settled = advanceMotion(reversed.value, reversed.velocity, 0, 2);
  assert.ok(Math.abs(settled.value) < 0.001);
});
