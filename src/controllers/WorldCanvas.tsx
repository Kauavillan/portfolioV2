"use client";

import { useEffect, useRef } from "react";
import { ATTR, STATE, sel } from "@lib/contract";
import { withMotionPreference } from "@lib/motion";
import { getWorldData } from "@data/index";
import { useUiStore } from "@stores/useUiStore";
import type { WorldHandle } from "@world/types";
import { openCaseFile } from "./case-actions";
import { useScroll } from "./ScrollProvider";
import { bindSkillBridge } from "./skill-bridge";

/**
 * Kill switch: build with `NEXT_PUBLIC_DISABLE_WORLD=1` to turn the 3D off in
 * production WITHOUT downloading the engine (the page behaves as `no-webgl`).
 */
const DISABLED = process.env.NEXT_PUBLIC_DISABLE_WORLD === "1";

/** Safari has no `requestIdleCallback`: the DOM lib types it as always present, so model it as optional. */
type MaybeIdleWindow = Window & {
  requestIdleCallback?: Window["requestIdleCallback"];
  cancelIdleCallback?: Window["cancelIdleCallback"];
};

/** `requestIdleCallback` with a timeout fallback. Returns a cancel function. */
function whenIdle(fn: () => void): () => void {
  const w = window as MaybeIdleWindow;
  const { requestIdleCallback, cancelIdleCallback } = w;
  if (requestIdleCallback && cancelIdleCallback) {
    const id = requestIdleCallback.call(w, fn, { timeout: 1200 });
    return () => cancelIdleCallback.call(w, id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}

/** Probes for a WebGL context on a throw-away canvas and releases it at once. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Mounts the 3D world behind the page: after idle, only if WebGL exists, and
 * through a dynamic `import("@world")` so `three` never reaches the initial
 * bundle. Anything that goes wrong ends in `html.no-webgl` (CSS background
 * + full content), never in a broken screen.
 */
export default function WorldCanvas() {
  const { onLayout } = useScroll();
  const handleRef = useRef<WorldHandle | null>(null);

  // Layout changed (fonts, resize, body height): rebuild the camera anchors.
  useEffect(() => onLayout(() => handleRef.current?.refresh()), [onLayout]);

  useEffect(() => {
    const html = document.documentElement;
    const { setWorldStatus } = useUiStore.getState();

    const unavailable = () => {
      html.classList.add(STATE.noWebgl);
      setWorldStatus("unavailable");
    };

    const container = document.querySelector<HTMLElement>(sel(ATTR.world));
    if (DISABLED || !container) {
      unavailable();
      return;
    }

    // Rebuilt if the user flips `prefers-reduced-motion` while the page is open.
    return withMotionPreference((reduced) => {
      let disposed = false;
      let handle: WorldHandle | null = null;
      let unbindSkills: (() => void) | null = null;
      const abort = new AbortController();
      setWorldStatus("loading");

      const start = async () => {
        if (disposed) return;
        if (!hasWebGL()) return unavailable();
        try {
          const { createWorld } = await import("@world");
          if (disposed) return;
          const created = await createWorld({
            ...getWorldData(),
            container,
            reduced,
            signal: abort.signal,
            // A click/tap on a project object opens its case file — unless something
            // modal is already in the way. Focus returns to that article's own button.
            onPick: (id) => {
              const ui = useUiStore.getState();
              if (ui.caseOpen || ui.navOpen || ui.introActive) return;
              openCaseFile(id, document.querySelector<HTMLElement>(sel(ATTR.openCase, id)));
            },
            onHover: () => {}, // sound (T28)
            onFrame: () => {},
            onStation: () => {},
          });
          if (disposed) {
            created.dispose(); // unmounted during the await (StrictMode)
            return;
          }
          handle = created;
          handleRef.current = created;
          unbindSkills = bindSkillBridge(created.lightSkill);
          html.classList.remove(STATE.noWebgl);
          setWorldStatus("ready");
        } catch (error) {
          if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
          console.warn("[world] unavailable, using the CSS background:", error);
          unavailable();
        }
      };

      const cancelIdle = whenIdle(() => void start());

      return () => {
        disposed = true;
        abort.abort();
        cancelIdle();
        unbindSkills?.();
        handle?.dispose();
        handleRef.current = null;
        setWorldStatus("idle");
      };
    });
  }, []);

  return null;
}
