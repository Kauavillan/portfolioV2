/**
 * Frame-rate independent easing: moves `value` towards `goal` by
 * `1 − exp(−dt·rate)` of the remaining distance. `instant` (reduced motion, or
 * a frame with no time) jumps straight to the goal.
 */
export function approach(
  value: number,
  goal: number,
  rate: number,
  dt: number,
  instant = false,
): number {
  return instant ? goal : value + (goal - value) * (1 - Math.exp(-dt * rate));
}

/**
 * Scale of something that dissolves with distance: 1 up to `near`, easing to
 * `floor` at `far` (never exactly 0: a zero scale breaks matrix inverses, and
 * keeping the object "visible" keeps its shaders compiled and the light count stable).
 */
export const FADE_FLOOR = 0.0001;
export function distanceFade(distance: number, near: number, far: number): number {
  const t = Math.min(1, Math.max(0, (distance - near) / (far - near)));
  return Math.max(FADE_FLOOR, 1 - t * t * (3 - 2 * t));
}

/** A lerp factor tuned for 60 fps (`perFrame` at 60 fps) that stays correct at any frame rate. */
export function perFrameRate(perFrame: number, dt: number): number {
  return 1 - Math.pow(1 - perFrame, dt * 60);
}
