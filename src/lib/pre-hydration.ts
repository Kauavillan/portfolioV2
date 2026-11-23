import { STATE } from "./contract";

/**
 * Inline script injected in <head>; it runs before first paint and before
 * hydration (F10). Everything is wrapped in try/catch: it must never break the page.
 *
 * - `html.motion` (motion allowed): `[data-reveal]` starts hidden from the very
 *   first paint, so there is no flash of visible content. Without JS the class
 *   never exists and the content stays visible.
 * - `html.is-intro` (motion allowed, no hash, near the top): the cinematic
 *   intro will play (T27). Scroll restoration is forced to manual so the intro
 *   always starts at the top. Until T27 nothing removes the class and nothing
 *   depends on it.
 */
export const PRE_HYDRATION_SCRIPT = `(function(){try{var d=document.documentElement;if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("${STATE.motion}");if(!location.hash&&window.scrollY<40){d.classList.add("${STATE.isIntro}");history.scrollRestoration="manual"}}}catch(e){}})();`;
