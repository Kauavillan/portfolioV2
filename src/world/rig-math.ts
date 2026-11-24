// Scroll → camera mapping, the pure part (F13 / ARCHITECTURE §6.3, steps 1-3 and 6).
// No `three`, no DOM: unit-testable with synthetic layouts.

/** The camera dwells during the first 18% of each stretch… */
export const DWELL = 0.18;
/** …and travels during the central 64%. */
export const TRAVEL = 0.64;
/** Layout breakpoint (keep in sync with BREAKPOINT_DESKTOP in src/lib/contract.ts). */
export const DESKTOP_MIN_WIDTH = 900;

export interface StationBox {
  /** Absolute top of the element in the page (px). */
  top: number;
  height: number;
}

export interface StationOffsets {
  /** Lateral film offset on desktop (negative pushes the scene to the right). */
  offset: number;
  /** …on narrow screens (usually 0 = centered). */
  offsetNarrow: number;
}

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Smooth 0→1 with zero first and second derivative at both ends. */
export function smootherstep(x: number): number {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Dwell/travel curve: 0 before f = .18, 1 after f = .82, smooth in between. */
export function blendFromF(f: number): number {
  return smootherstep(clamp01((f - DWELL) / TRAVEL));
}

/**
 * Scroll position at which each station is centered in the viewport:
 * `top + min(height, 1.2·vh)/2 − vh/2`, forced strictly increasing.
 */
export function computeAnchors(
  stations: readonly StationBox[],
  viewportHeight: number,
): number[] {
  const anchors: number[] = [];
  for (const s of stations) {
    const raw = s.top + Math.min(s.height, 1.2 * viewportHeight) / 2 - viewportHeight / 2;
    const prev = anchors[anchors.length - 1];
    anchors.push(prev === undefined ? raw : Math.max(raw, prev + 1));
  }
  return anchors;
}

/**
 * Which stretch the scroll position is in: `index` = last anchor ≤ scrollY and
 * `f` ∈ [0, 1) the progress towards the next one. Before the first anchor and
 * after the last one the camera stays put (`f = 0`).
 */
export function locate(
  anchors: readonly number[],
  scrollY: number,
): { index: number; f: number } {
  const n = anchors.length;
  if (n < 2 || scrollY < anchors[0]) return { index: 0, f: 0 };
  if (scrollY >= anchors[n - 1]) return { index: n - 1, f: 0 };
  let i = 0;
  while (i < n - 2 && scrollY >= anchors[i + 1]) i++;
  return { index: i, f: (scrollY - anchors[i]) / (anchors[i + 1] - anchors[i]) };
}

/** Position along the station curve, `u ∈ [0, 1]`. */
export function curveParam(index: number, blend: number, count: number): number {
  if (count < 2) return 0;
  return clamp01((index + blend) / (count - 1));
}

/** Station nearest to the camera: used for `onStation`, mood and reduced motion. */
export function nearestStation(index: number, blend: number, count: number): number {
  if (count < 1) return 0;
  return Math.min(count - 1, blend < 0.5 ? index : index + 1);
}

/** Lateral film offset interpolated between the two stations of the stretch. */
export function filmOffsetAt(
  index: number,
  blend: number,
  stations: readonly StationOffsets[],
  viewportWidth: number,
): number {
  if (stations.length === 0) return 0;
  const narrow = viewportWidth < DESKTOP_MIN_WIDTH;
  const pick = (s: StationOffsets) => (narrow ? s.offsetNarrow : s.offset);
  const a = stations[Math.min(index, stations.length - 1)];
  const b = stations[Math.min(index + 1, stations.length - 1)];
  return pick(a) + (pick(b) - pick(a)) * blend;
}
