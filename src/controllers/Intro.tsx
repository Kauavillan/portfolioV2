"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ATTR, STATE, attr, sel } from "@lib/contract";
import {
  ITEM_REVEAL_S,
  ITEM_STAGGER_S,
  LETTER_RISE_S,
  LETTER_STAGGER_S,
  OVERLAY_FADE_S,
  STATUS_DELAY_MS,
  WATCHDOG_MS,
  WORLD_WAIT_MS,
  isSkipKey,
  planIntro,
  shouldPlayIntro,
} from "@lib/intro";
import { REDUCED_MOTION_QUERY } from "@lib/motion";
import { STORAGE_KEYS, readStorage, writeStorage } from "@lib/storage";
import { useUiStore } from "@stores/useUiStore";
import type { WorldHandle } from "@world/types";
import { getWorldHandle, waitForWorld } from "./world-bridge";
import styles from "@styles/Intro.module.scss";

/** Letters start below their line, invisible. */
const LETTER_FROM = { yPercent: 110, opacity: 0 } as const;
/** Everything else in the hero starts a little lower, invisible. */
const ITEM_FROM = { y: 24, opacity: 0 } as const;

/** The pre-hydration script forced `manual` for the intro; hand the browser its normal behavior back. */
function restoreScrollRestoration(): void {
  try {
    history.scrollRestoration = "auto";
  } catch {
    /* not supported */
  }
}

/** How many effect instances are alive (StrictMode runs the effect twice, back to back). */
let alive = 0;

/**
 * Cinematic opening (F10): an overlay with one mono line, the world loads, the
 * camera flies in and the name rises letter by letter. It plays only when the
 * pre-hydration script set `html.is-intro` (motion allowed, no hash, at the
 * top). Skippable by button, wheel, touch or any key but Tab. Page scroll is
 * locked while it runs; `is-intro` and the lock are released on every path
 * (finish, skip, error, timeout, unmount).
 *
 * Without a world (no WebGL, kill switch, boot too slow) the same text reveal
 * plays with no fly-in. The overlay line is pure CSS, so it is on screen
 * before any of this runs.
 */
export default function Intro() {
  const t = useTranslations("Intro");
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const [statusVisible, setStatusVisible] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains(STATE.isIntro)) return; // reduced motion / hash / not at the top
    if (!shouldPlayIntro({ hash: window.location.hash, scrollY: window.scrollY })) {
      html.classList.remove(STATE.isIntro);
      restoreScrollRestoration();
      return;
    }

    alive += 1;
    useUiStore.getState().setIntroActive(true);

    const overlay = rootRef.current;
    const skipButton = skipRef.current;
    const letters = gsap.utils.toArray<HTMLElement>(sel(ATTR.heroCh));
    const heroItems = gsap.utils.toArray<HTMLElement>(sel(ATTR.heroItem));
    const lastItems = heroItems.filter((el) => el.getAttribute(ATTR.heroItem) === "last");
    const items = [...heroItems.filter((el) => !lastItems.includes(el)), ...lastItems];
    const h1 = document.querySelector<HTMLElement>("#home h1");

    const abort = new AbortController();
    let finished = false;
    let timeline: gsap.core.Timeline | null = null;
    let handle: WorldHandle | null = null;
    let statusTimer = 0;
    let watchdog = 0;

    const ctx = gsap.context(() => {
      gsap.set(letters, LETTER_FROM);
      gsap.set(items, ITEM_FROM);
    });

    const release = () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(watchdog);
      abort.abort();
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", onKey);
      skipButton?.removeEventListener("click", skip);
      motion.removeEventListener("change", onMotionChange);
    };

    /** Ends the intro for good. Idempotent: skip, completion and the watchdog can all arrive. */
    const finish = () => {
      if (finished) return;
      finished = true;
      release();
      const live = handle ?? getWorldHandle();
      if (live) live.rig.intro.value = 1; // never leave the camera mid-flight
      // Leave the elements as the stylesheet defines them, not as GSAP last wrote them.
      gsap.set([...letters, ...items], { clearProps: "opacity,transform" });
      html.classList.remove(STATE.isIntro);
      restoreScrollRestoration();
      useUiStore.getState().setIntroActive(false);
      if (skipButton && document.activeElement === skipButton) {
        h1?.focus({ preventScroll: true });
      }
    };

    const play = (world: WorldHandle | null) => {
      if (finished || timeline) return;
      handle = world;
      window.clearTimeout(statusTimer);
      setStatusVisible(false);

      const firstVisit = readStorage(STORAGE_KEYS.introSeen) === null;
      writeStorage(STORAGE_KEYS.introSeen, "1");
      const plan = planIntro({ firstVisit, hasWorld: world !== null });

      timeline = gsap.timeline({ onComplete: finish });
      ctx.add(() => {
        if (overlay) {
          timeline?.to(overlay, { autoAlpha: 0, duration: OVERLAY_FADE_S, ease: "power2.out" }, 0);
        }
        if (world) {
          world.rig.intro.value = 0;
          timeline?.to(world.rig.intro, { value: 1, duration: plan.fly, ease: "power3.inOut" }, 0);
        }
        timeline?.to(
          letters,
          { yPercent: 0, opacity: 1, duration: LETTER_RISE_S, ease: "expo.out", stagger: LETTER_STAGGER_S },
          plan.lettersAt,
        );
        timeline?.to(
          items,
          { y: 0, opacity: 1, duration: ITEM_REVEAL_S, ease: "expo.out", stagger: ITEM_STAGGER_S },
          plan.itemsAt,
        );
      });
    };

    /** Jumps to the end. Once: a second call (key + click on the button) finds `finished` set. */
    function skip() {
      if (finished) return;
      abort.abort(); // stop waiting for the world
      if (!timeline) play(getWorldHandle());
      try {
        timeline?.progress(1);
      } catch {
        /* finish() below covers it */
      }
      finish();
    }
    function onKey(event: KeyboardEvent) {
      if (isSkipKey(event.key)) skip();
    }
    const motion = window.matchMedia(REDUCED_MOTION_QUERY);
    function onMotionChange() {
      if (motion.matches) skip();
    }

    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    window.addEventListener("keydown", onKey);
    skipButton?.addEventListener("click", skip);
    motion.addEventListener("change", onMotionChange);

    statusTimer = window.setTimeout(() => setStatusVisible(true), STATUS_DELAY_MS);
    watchdog = window.setTimeout(skip, WATCHDOG_MS);

    void waitForWorld(WORLD_WAIT_MS, abort.signal).then((world) => {
      if (abort.signal.aborted) return; // skipped or unmounted: nothing left to start
      try {
        play(world);
      } catch (error) {
        console.warn("[intro] failed, finishing immediately:", error);
        skip();
      }
    });

    return () => {
      alive -= 1;
      const wasFinished = finished;
      finished = true;
      timeline?.kill();
      timeline = null;
      // Finished: leave the final state alone. Interrupted: put the hero back as it was.
      if (wasFinished) ctx.kill();
      else ctx.revert();
      release();
      if (!wasFinished) {
        useUiStore.getState().setIntroActive(false);
        // StrictMode re-runs the effect right away and needs `is-intro` still in place;
        // if nothing took over by the end of this task, this really was an unmount.
        queueMicrotask(() => {
          if (alive !== 0) return;
          html.classList.remove(STATE.isIntro);
          restoreScrollRestoration();
        });
      }
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.intro} {...attr(ATTR.intro)}>
      <p className={styles.line} {...attr(ATTR.introLine)}>
        {t("line")}
      </p>
      <p className={styles.status} {...attr(ATTR.introStatus)} role="status">
        {statusVisible ? t("status") : ""}
      </p>
      <button ref={skipRef} type="button" className={`btn btn-quiet ${styles.skip}`} {...attr(ATTR.introSkip)}>
        {t("skip")}
      </button>
    </div>
  );
}
