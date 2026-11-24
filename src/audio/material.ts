// Sound material: our own tuning tables, generated buffers and the listener
// math. Pure (no `AudioContext`, no DOM) and only needed by the audio graph, so
// it travels in the lazy chunk, not in the initial bundle.

import type { SectorKey } from "@data/types";
import type { ListenerSource, Quat, Vec3 } from "./pure";

// ── Tuning (our own: a G-major pentatonic world) ───────────────────────────

/** Equal-tempered frequency of a MIDI note (A4 = 69 = 440 Hz). */
export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Drone: root, fifth and octave of G, each slightly detuned (cents). */
export const DRONE = [
  { type: "sine", hz: midiToHz(31), detune: -5 }, //  G1 ≈ 49.0
  { type: "triangle", hz: midiToHz(38), detune: 4 }, // D2 ≈ 73.4
  { type: "sine", hz: midiToHz(43), detune: 7 }, //  G2 ≈ 98.0
] as const;

/** One dyad of sine waves per sector: a ladder that climbs from home to contact. */
export const SECTOR_DYADS: Readonly<Record<SectorKey, readonly [number, number]>> = {
  home: [midiToHz(55), midiToHz(62)], // G3 + D4
  about: [midiToHz(57), midiToHz(64)], // A3 + E4
  work: [midiToHz(59), midiToHz(64)], // B3 + E4
  skills: [midiToHz(62), midiToHz(69)], // D4 + A4
  journey: [midiToHz(64), midiToHz(71)], // E4 + B4
  contact: [midiToHz(67), midiToHz(74)], // G4 + D5 (home, an octave up)
};

/** Slow gain-LFO rate (Hz) of each emitter, so they never pulse in unison. */
export const SECTOR_LFO_HZ: Readonly<Record<SectorKey, number>> = {
  home: 0.07,
  about: 0.085,
  work: 0.1,
  skills: 0.078,
  journey: 0.092,
  contact: 0.115,
};

/** G-major pentatonic from D4 up two octaves: scrolling down climbs the scale. */
export const ARRIVE_SCALE: readonly number[] = [
  62, 64, 67, 69, 71, 74, 76, 79, 81, 83, 86,
].map(midiToHz);

/** Pitch of the arrival chord for station `index` (clamped to the scale ends). */
export function arriveRoot(index: number): number {
  const i = Math.min(ARRIVE_SCALE.length - 1, Math.max(0, Math.trunc(index) || 0));
  return ARRIVE_SCALE[i];
}

/** Partial ratios of the arrival chord over its root. */
export const ARRIVE_PARTIALS = [1, 1.5, 2.01] as const;

/** Frequencies of the arrival chord of station `index`. */
export const arriveChord = (index: number): number[] => {
  const root = arriveRoot(index);
  return ARRIVE_PARTIALS.map((ratio) => root * ratio);
};

// ── Generated sound material ───────────────────────────────────────────────

/** Small deterministic PRNG (mulberry32) so generated buffers are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fills `out` with one channel of a reverb impulse response: white noise whose
 * amplitude falls as `(1 − t)³`, `t` being the position in the buffer (0 → 1).
 */
export function fillImpulse(out: Float32Array, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    out[i] = (rand() * 2 - 1) * Math.pow(1 - t, 3);
  }
  return out;
}

/** Fills `out` with white noise in [−1, 1). */
export function fillNoise(out: Float32Array, seed: number): Float32Array {
  const rand = mulberry32(seed);
  for (let i = 0; i < out.length; i++) out[i] = rand() * 2 - 1;
  return out;
}

// ── Listener ───────────────────────────────────────────────────────────────

export interface ListenerPose {
  position: Vec3;
  forward: Vec3;
  up: Vec3;
}

/** Rotates `v` by the unit quaternion `q`. */
function rotate(q: Quat, v: Vec3): Vec3 {
  // t = 2 · (q.xyz × v); v' = v + w·t + q.xyz × t
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Camera looking down −Z with +Y up (the three.js convention), turned by `q`. */
export function listenerPose(source: ListenerSource): ListenerPose {
  return {
    position: { x: source.position.x, y: source.position.y, z: source.position.z },
    forward: rotate(source.quaternion, { x: 0, y: 0, z: -1 }),
    up: rotate(source.quaternion, { x: 0, y: 1, z: 0 }),
  };
}

/** True when two poses differ by more than `eps` anywhere (skips redundant updates). */
export function poseChanged(a: ListenerPose | null, b: ListenerPose, eps = 1e-3): boolean {
  if (!a) return true;
  const far = (p: Vec3, q: Vec3) =>
    Math.abs(p.x - q.x) > eps || Math.abs(p.y - q.y) > eps || Math.abs(p.z - q.z) > eps;
  return far(a.position, b.position) || far(a.forward, b.forward) || far(a.up, b.up);
}
