// Light, pure helpers shared by the engine (always loaded) and the audio graph
// (loaded when sound is first turned on): timing, levels, throttle and the
// shared types. Nothing here touches `AudioContext` or the DOM, so every
// function is testable in plain Node. The heavy material (tuning tables,
// generated buffers, listener math) lives in `./material`.

import type { SectorKey } from "@data/types";

export type SoundCategory = "ambient" | "interaction";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** What the engine needs from a camera. A three.js `PerspectiveCamera` fits as is. */
export interface ListenerSource {
  position: Vec3;
  quaternion: Quat;
}

export interface EmitterInput {
  key: SectorKey;
  position: Vec3;
}

// ── Timing ─────────────────────────────────────────────────────────────────

/** Minimum gap between two hover ticks (ms). */
export const HOVER_THROTTLE_MS = 450;

/**
 * Leading-edge throttle: `allow(now)` is true at most once per `ms`. The clock
 * is passed in, so it is deterministic under test.
 */
export function createThrottle(ms: number): { allow(now: number): boolean; reset(): void } {
  let last = Number.NEGATIVE_INFINITY;
  return {
    allow(now) {
      if (now - last < ms) return false;
      last = now;
      return true;
    },
    reset() {
      last = Number.NEGATIVE_INFINITY;
    },
  };
}

// ── Levels ─────────────────────────────────────────────────────────────────

/** Master gain reached by the fade-in at volume 1: headroom for the compressor. */
export const MASTER_HEADROOM = 0.9;
export const FADE_IN_S = 1.6;
export const FADE_OUT_S = 0.12;
/** The context is suspended this long after the fade-out starts (ms). */
export const SUSPEND_DELAY_MS = 200;

/** Master gain for a 0 → 1 volume (linear, with headroom for the compressor). */
export const masterTarget = (volume: number): number =>
  Math.min(1, Math.max(0, volume)) * MASTER_HEADROOM;
