// Pure maths behind the "active section" (F04). Kept free of the DOM so it can
// be unit-tested with synthetic layouts (Vitest arrives in T35).

/** A section becomes active once its top crosses this fraction of the viewport height. */
export const ACTIVE_LINE = 0.45;

/**
 * Index of the LAST section whose top is at or above 45% of the viewport.
 * `tops` are `getBoundingClientRect().top` values in document order.
 * Falls back to 0 (above the first section / empty list).
 */
export function computeActiveIndex(
  tops: readonly number[],
  viewportHeight: number,
): number {
  const line = viewportHeight * ACTIVE_LINE;
  let active = 0;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= line) active = i;
  }
  return active;
}

/** Page scroll progress in [0, 1]; 0 when the page is not scrollable. */
export function computeProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const max = scrollHeight - viewportHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / max));
}
