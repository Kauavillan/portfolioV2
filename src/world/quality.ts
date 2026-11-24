// Adaptive quality (F14): tiers, the initial pick and the FPS sampler.
//
// PURE: imports neither `three` nor touches `window` (the environment is passed
// in), so it is unit-testable. Constants live in QUALITY_CONFIG for the tests.

export type QualityName = "low" | "medium" | "high";

export interface QualityTier {
  name: QualityName;
  /** Max device pixel ratio. */
  dpr: number;
  /** Stars drawn (`setDrawRange`). */
  stars: number;
  /** Dust particles drawn. */
  dust: number;
  /** Bloom post-processing (T26). */
  bloom: boolean;
  /** fbm octaves of the sky shader. */
  octaves: number;
}

export const TIERS: Readonly<Record<QualityName, QualityTier>> = {
  low: { name: "low", dpr: 1, stars: 2600, dust: 350, bloom: false, octaves: 2 },
  medium: { name: "medium", dpr: 1.5, stars: 5200, dust: 800, bloom: false, octaves: 3 },
  high: { name: "high", dpr: 2, stars: 8000, dust: 1300, bloom: true, octaves: 4 },
};

/** Worst → best. */
export const TIER_ORDER: readonly QualityName[] = ["low", "medium", "high"];

export const QUALITY_CONFIG = {
  /** Frames ignored after the start and after every tier change. */
  warmupMs: 2500,
  /** Rolling window of frame times. */
  windowFrames: 60,
  /** An isolated frame longer than this (tab switch, GC…) is ignored… */
  ignoreOverMs: 250,
  /**
   * …but this many CONSECUTIVE long frames are real overload, not a hiccup, and
   * count (clamped to `ignoreOverMs`). A device that never beats ~4 fps would
   * otherwise leave the sampler blind (every frame "ignored") and never be
   * downgraded. 15 frames ≈ 3.75 s of continuous < 4 fps, so a one-off GC or
   * shader-compile hitch (≤ ~2 s) can never trigger a permanent downgrade.
   */
  sustainedOverFrames: 15,
  /** Window average above this ⇒ step down. */
  slowAvgMs: 24,
  /** Window average below this, sustained ⇒ step up. */
  fastAvgMs: 11,
  fastSustainMs: 5000,
  /** `initialTier` thresholds. */
  minCores: 4,
  smallViewportPx: 600,
  lowMemoryGb: 4,
} as const;

export interface QualityEnv {
  /** `navigator.hardwareConcurrency`. */
  cores: number;
  viewportWidth: number;
  /** `navigator.deviceMemory` (GB). `undefined` where the API does not exist (Safari, Firefox). */
  deviceMemory?: number;
  /** `matchMedia("(pointer: coarse)")`. */
  coarsePointer: boolean;
}

/**
 * `medium` on capable devices, `low` otherwise — it never starts at `high`
 * (the sampler earns that). An unknown `deviceMemory` is not held against the device.
 */
export function initialTier(env: QualityEnv, config = QUALITY_CONFIG): QualityName {
  const lowMemory = (env.deviceMemory ?? Infinity) < config.lowMemoryGb;
  const smallAndWeak = env.viewportWidth < config.smallViewportPx && lowMemory;
  const touchAndWeak = env.coarsePointer && lowMemory;
  return env.cores >= config.minCores && !smallAndWeak && !touchAndWeak
    ? "medium"
    : "low";
}

export type QualityChange = -1 | 0 | 1;

export interface QualitySampler {
  /** Tier the sampler believes is applied (it follows its own ±1 answers). */
  readonly tier: QualityName;
  /** True once it has stepped down: it never steps up again (avoids oscillation). */
  readonly downgraded: boolean;
  /**
   * Feed one frame. `dtMs` = real frame time, `nowMs` = a monotonic clock.
   * Returns -1 (step down), +1 (step up) or 0. The caller applies the tier.
   */
  sample(dtMs: number, nowMs: number): QualityChange;
}

export function createSampler(
  initial: QualityName,
  config = QUALITY_CONFIG,
): QualitySampler {
  let tierIndex = TIER_ORDER.indexOf(initial);
  let downgraded = false;
  let warmupEnd: number | null = null;
  let fastSince: number | null = null;
  let consecutiveOver = 0;
  const samples: number[] = [];
  let sum = 0;

  const reopenWarmup = (nowMs: number) => {
    samples.length = 0;
    sum = 0;
    fastSince = null;
    consecutiveOver = 0;
    warmupEnd = nowMs + config.warmupMs;
  };

  return {
    get tier() {
      return TIER_ORDER[tierIndex];
    },
    get downgraded() {
      return downgraded;
    },
    sample(dtMs, nowMs) {
      if (warmupEnd === null) warmupEnd = nowMs + config.warmupMs;
      if (nowMs < warmupEnd) return 0;

      let frameMs = dtMs;
      if (dtMs > config.ignoreOverMs) {
        consecutiveOver += 1;
        if (consecutiveOver < config.sustainedOverFrames) return 0; // isolated hiccup
        frameMs = config.ignoreOverMs; // sustained overload: it counts
      } else {
        consecutiveOver = 0;
      }

      samples.push(frameMs);
      sum += frameMs;
      if (samples.length > config.windowFrames) sum -= samples.shift() as number;
      if (samples.length < config.windowFrames) return 0;

      const average = sum / samples.length;

      if (average > config.slowAvgMs && tierIndex > 0) {
        tierIndex -= 1;
        downgraded = true;
        reopenWarmup(nowMs);
        return -1;
      }

      if (average < config.fastAvgMs && !downgraded && tierIndex < TIER_ORDER.length - 1) {
        fastSince ??= nowMs;
        if (nowMs - fastSince > config.fastSustainMs) {
          tierIndex += 1;
          reopenWarmup(nowMs);
          return 1;
        }
      } else {
        fastSince = null;
      }
      return 0;
    },
  };
}
