import type { SprayParticle } from "./spray-model";

export type SprayParticleGroup = {
  alpha: number;
  particles: SprayParticle[];
};

export type SprayParticlePath = {
  alpha: number;
  path: Path2D;
};

export function groupParticlesByAlpha(
  particles: SprayParticle[],
): SprayParticleGroup[] {
  const groups = new Map<number, SprayParticle[]>();

  for (const particle of particles) {
    const group = groups.get(particle.alpha);

    if (group) {
      group.push(particle);
    } else {
      groups.set(particle.alpha, [particle]);
    }
  }

  return Array.from(groups, ([alpha, groupedParticles]) => ({
    alpha,
    particles: groupedParticles,
  }));
}

export function createParticlePathCache(
  particles: SprayParticle[],
): SprayParticlePath[] {
  return groupParticlesByAlpha(particles).map((group) => {
    const path = new Path2D();

    for (const particle of group.particles) {
      path.moveTo(particle.x + particle.radius, particle.y);
      path.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2,
      );
    }

    return { alpha: group.alpha, path };
  });
}
