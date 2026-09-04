export function revealProgress(top: number, height: number, viewport: number) {
  const distance = Math.min(Math.max(height, 140), viewport * 0.6);
  return Math.max(0, Math.min(1, (viewport - top) / distance));
}

// Critically damped spring: preserve velocity when scrolling reverses.
export function advanceMotion(value: number, velocity: number, target: number, seconds: number) {
  const frequency = 11;
  const displacement = value - target;
  const coefficient = velocity + frequency * displacement;
  const decay = Math.exp(-frequency * seconds);
  return {
    value: target + (displacement + coefficient * seconds) * decay,
    velocity: (velocity - frequency * coefficient * seconds) * decay,
  };
}
