"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { STATE } from "@lib/contract";
import { withMotionPreference } from "@lib/motion";
import { useUiStore } from "@stores/useUiStore";

/** Duration (s) of programmatic scrolls (anchors, menu). */
const SCROLL_TO_DURATION = 2.2;
/** Layout refresh debounce (ms) — F08. */
const REFRESH_DEBOUNCE = 200;
const DEFAULT_AUTO_REFRESH = "visibilitychange,DOMContentLoaded,load,resize";

export type ScrollTarget = string | Element | number;

export interface ScrollToOptions {
  /** Jump without animation. */
  immediate?: boolean;
  onComplete?: () => void;
}

export interface ScrollApi {
  /** Scrolls to an element / selector / absolute offset. Works without Lenis. */
  to: (target: ScrollTarget, options?: ScrollToOptions) => void;
  /** Takes one scroll lock (counted — see `useUiStore`). */
  stop: () => void;
  /** Releases one scroll lock. */
  start: () => void;
  /** Runs `cb` after every layout refresh (fonts, resize, body height). Returns the unsubscribe. */
  onLayout: (cb: () => void) => () => void;
  /** The Lenis instance, or `null` (reduced motion / not mounted yet). */
  getLenis: () => Lenis | null;
}

const ScrollContext = createContext<ScrollApi | null>(null);

export function useScroll(): ScrollApi {
  const api = useContext(ScrollContext);
  if (!api) throw new Error("useScroll must be used inside <ScrollProvider>");
  return api;
}

/**
 * One scroll layer for the whole page: Lenis driven by the GSAP ticker,
 * ScrollTrigger in sync, counted scroll locks and a debounced layout refresh.
 * Reduced motion → no Lenis; native scrolling, `to()` still works.
 */
export default function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const layoutCallbacks = useRef(new Set<() => void>());

  // ── Smooth scroll + scroll locks ───────────────────────────────────────
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const html = document.documentElement;

    const stopWatching = withMotionPreference((reduced) => {
      let lenis: Lenis | null = null;
      let tick: ((time: number) => void) | null = null;
      let onScroll: (() => void) | null = null;

      if (!reduced) {
        lenis = new Lenis({
          duration: 1.25,
          easing: (t) => 1 - (1 - t) ** 4,
          smoothWheel: true,
          autoRaf: false,
        });
        lenisRef.current = lenis;
        onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);
        // One clock: the GSAP ticker drives Lenis.
        tick = (time) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      // Counted locks → `html.scroll-locked` (+ Lenis stop/start when present).
      const applyLocks = (locks: number) => {
        const locked = locks > 0;
        html.classList.toggle(STATE.scrollLocked, locked);
        if (lenis) {
          if (locked) lenis.stop();
          else lenis.start();
        }
      };
      applyLocks(useUiStore.getState().scrollLocks);
      const unsubscribe = useUiStore.subscribe((state, prev) => {
        if (state.scrollLocks !== prev.scrollLocks) applyLocks(state.scrollLocks);
      });

      return () => {
        unsubscribe();
        html.classList.remove(STATE.scrollLocked);
        if (tick) gsap.ticker.remove(tick);
        if (lenis) {
          gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
          if (onScroll) lenis.off("scroll", onScroll);
          lenis.destroy();
        }
        lenisRef.current = null;
      };
    });

    return stopWatching;
  }, []);

  // ── Layout refresh (F08) ───────────────────────────────────────────────
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // We refresh on our own (debounced + signature-gated); the built-in
    // `resize`/`load` refreshes would make it run twice.
    ScrollTrigger.config({ autoRefreshEvents: "visibilitychange" });

    let timer = 0;
    let lastSignature = "";
    let cancelled = false;

    const signature = () =>
      `${document.documentElement.scrollHeight}x${window.innerWidth}x${window.innerHeight}`;

    const run = () => {
      timer = 0;
      const next = signature();
      if (next === lastSignature) return;
      lastSignature = next;
      ScrollTrigger.refresh();
      layoutCallbacks.current.forEach((cb) => cb());
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, REFRESH_DEBOUNCE);
    };

    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    void document.fonts?.ready.then(() => {
      if (!cancelled) schedule();
    });
    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      observer.disconnect();
      ScrollTrigger.config({ autoRefreshEvents: DEFAULT_AUTO_REFRESH });
    };
  }, []);

  // ── API ────────────────────────────────────────────────────────────────
  const to = useCallback<ScrollApi["to"]>((target, options = {}) => {
    const el =
      typeof target === "string" ? document.querySelector(target) : target;
    if (el === null) return;
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(el, {
        duration: SCROLL_TO_DURATION,
        offset: 0,
        immediate: options.immediate,
        onComplete: () => options.onComplete?.(),
      });
      return;
    }

    // Native path (reduced motion / before Lenis exists): instant jump.
    if (typeof el === "number") window.scrollTo(0, el);
    else el.scrollIntoView({ block: "start", behavior: "auto" });
    options.onComplete?.();
  }, []);

  const api = useMemo<ScrollApi>(
    () => ({
      to,
      stop: () => useUiStore.getState().lockScroll(),
      start: () => useUiStore.getState().unlockScroll(),
      onLayout: (cb) => {
        layoutCallbacks.current.add(cb);
        return () => {
          layoutCallbacks.current.delete(cb);
        };
      },
      getLenis: () => lenisRef.current,
    }),
    [to],
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
