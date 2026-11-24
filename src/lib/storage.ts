/**
 * `localStorage` that never throws: private mode, blocked site data and quota
 * errors all degrade to "nothing is remembered". Client-only; safe to import
 * anywhere (it touches `window` only when called).
 */

/** Namespace for every key the site writes. */
export const STORAGE_PREFIX = "kvn";

export const STORAGE_KEYS = {
  /** `"1"` once the intro has played (only shortens the next one). */
  introSeen: `${STORAGE_PREFIX}:intro-seen`,
  /** JSON of the sound preferences (see `src/audio/prefs.ts`). */
  sound: `${STORAGE_PREFIX}:sound`,
} as const;

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
