import { STATE } from "./contract";

/**
 * Inline script injected in <head>; it runs before first paint and before
 * hydration (F10). Everything is wrapped in try/catch: it must never break the page.
 *
 * - `html.motion` (motion allowed): `[data-reveal]` starts hidden from the very
 *   first paint, so there is no flash of visible content. Without JS the class
 *   never exists and the content stays visible.
 * - `html.is-intro` (motion allowed, no hash, near the top, a fresh visit — not
 *   a reload or back/forward): the cinematic intro will play (T27). It shows the
 *   overlay from the first paint; the `Intro` controller removes the class when
 *   the intro ends (or is skipped). Scroll restoration is forced to manual so the
 *   intro starts at the top; the controller puts it back to `auto` afterwards, so
 *   a later reload mid-page keeps the visitor where they were (and skips the intro).
 */
export const PRE_HYDRATION_SCRIPT = `(function(){try{var d=document.documentElement;if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("${STATE.motion}");var n=performance.getEntriesByType("navigation")[0];if(!location.hash&&window.scrollY<40&&(!n||n.type==="navigate"||n.type==="prerender")){d.classList.add("${STATE.isIntro}");history.scrollRestoration="manual"}}}catch(e){}})();`;
