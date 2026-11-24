// Sound preferences: pure parts (no AudioContext, no DOM) so they can be unit
// tested. Persistence goes through `@lib/storage`, which never throws.

import { STORAGE_KEYS, readStorage, writeStorage } from "@lib/storage";

export interface SoundPrefs {
  /** Off by default: nothing plays until the visitor asks for it. */
  enabled: boolean;
  /** 0 → 1 (the UI shows 0 → 100). */
  volume: number;
  /** Drone, air and the spatial emitters. */
  ambient: boolean;
  /** Arrive / open / close / hover sounds. */
  interaction: boolean;
}

export const DEFAULT_PREFS: Readonly<SoundPrefs> = {
  enabled: false,
  volume: 0.6,
  ambient: true,
  interaction: true,
};

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * Merges untrusted stored data over the defaults: unknown keys are dropped,
 * wrong types fall back to the default, `volume` is clamped to 0 → 1.
 */
export function mergePrefs(raw: unknown): SoundPrefs {
  const out: SoundPrefs = { ...DEFAULT_PREFS };
  if (typeof raw !== "object" || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.enabled === "boolean") out.enabled = r.enabled;
  if (typeof r.ambient === "boolean") out.ambient = r.ambient;
  if (typeof r.interaction === "boolean") out.interaction = r.interaction;
  if (typeof r.volume === "number" && Number.isFinite(r.volume)) out.volume = clamp01(r.volume);
  return out;
}

/** Parses the stored string; anything malformed yields the defaults. */
export function parsePrefs(text: string | null): SoundPrefs {
  if (text === null) return { ...DEFAULT_PREFS };
  try {
    return mergePrefs(JSON.parse(text));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export const loadPrefs = (): SoundPrefs => parsePrefs(readStorage(STORAGE_KEYS.sound));

export const savePrefs = (prefs: SoundPrefs): void => {
  writeStorage(STORAGE_KEYS.sound, JSON.stringify(prefs));
};
