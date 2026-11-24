// Pure rules of the intro sequence (T27): when it plays, how long each part
// lasts, what skips it. No DOM, no GSAP — testable in plain Node.

/** Wait for the world at most this long (ms); then the intro runs without the fly-in. */
export const WORLD_WAIT_MS = 4500;
/** "Loading the 3D world…" appears after this long without a world (ms). */
export const STATUS_DELAY_MS = 600;
/** Last resort: whatever happens, the intro is over by now (ms). */
export const WATCHDOG_MS = 14000;

export const FLY_FIRST_VISIT_S = 3.4;
export const FLY_RETURN_VISIT_S = 1.9;
export const OVERLAY_FADE_S = 1.1;
export const LETTER_RISE_S = 1.2;
export const LETTER_STAGGER_S = 0.06;
export const ITEM_REVEAL_S = 1;
export const ITEM_STAGGER_S = 0.08;

export interface IntroPlan {
  /** Seconds the camera flies (0 = no fly-in: there is no world). */
  fly: number;
  /** When the letters start rising, relative to the start of the timeline. */
  lettersAt: number;
  /** When the remaining hero items start revealing. */
  itemsAt: number;
}

/**
 * Durations for one run. With a world the name rises while the camera is
 * still arriving (≈ 45 % into the flight); without one everything starts at once.
 */
export function planIntro({ firstVisit, hasWorld }: { firstVisit: boolean; hasWorld: boolean }): IntroPlan {
  const fly = hasWorld ? (firstVisit ? FLY_FIRST_VISIT_S : FLY_RETURN_VISIT_S) : 0;
  const lettersAt = hasWorld ? Math.max(0.5, fly * 0.45) : 0.25;
  return { fly, lettersAt, itemsAt: lettersAt + LETTER_STAGGER_S * 4 + 0.35 };
}

/**
 * The intro only plays at the very top of a fresh page load: a `#hash` (a
 * deep link or a case file) or a scrolled page means the visitor wants content.
 * The pre-hydration script decides first; this re-checks at hydration.
 */
export function shouldPlayIntro({ hash, scrollY }: { hash: string; scrollY: number }): boolean {
  return hash === "" && scrollY < 40;
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock"]);

/** Any key skips the intro except Tab (moving focus) and bare modifiers (shortcuts in progress). */
export const isSkipKey = (key: string): boolean => key !== "Tab" && !MODIFIER_KEYS.has(key);
