import assert from "node:assert/strict";
import test from "node:test";

import { groupParticlesByAlpha } from "./spray-path-cache.ts";

test("입자를 원래 알파별로 묶고 모든 원을 정확히 한 번 보존한다", () => {
  const particles = [
    { alpha: 0.2, radius: 1, x: 10, y: 20 },
    { alpha: 0.7, radius: 2, x: 30, y: 40 },
    { alpha: 0.2, radius: 3, x: 50, y: 60 },
  ];

  const groups = groupParticlesByAlpha(particles);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].alpha, 0.2);
  assert.deepEqual(groups[0].particles, [particles[0], particles[2]]);
  assert.equal(groups[1].alpha, 0.7);
  assert.deepEqual(groups[1].particles, [particles[1]]);
  assert.equal(
    groups.reduce((total, group) => total + group.particles.length, 0),
    particles.length,
  );
});
