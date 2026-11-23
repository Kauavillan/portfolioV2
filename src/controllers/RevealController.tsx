"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ATTR, STATE, sel } from "@lib/contract";
import { withMotionPreference } from "@lib/motion";

// Timings measured on the reference (F09) — behavior, not code.
const FROM_Y = 28;
const LEAVE_Y = -24;

/**
 * Reveals `[data-reveal]` elements as their group enters the viewport and
 * hides them again when they leave (except inside #contact). Groups are the
 * elements sharing the closest `[data-reveal-scope]` (or the same parent), so
 * one ScrollTrigger drives a whole staggered group.
 *
 * - `#home` is excluded: the intro (T27) owns its entrance.
 * - Reduced motion: does nothing, everything stays visible.
 * - `html.motion` is added before hydration (pre-hydration script) so there is
 *   no flash; the controller keeps it in sync with the preference.
 */
export default function RevealController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const html = document.documentElement;

    return withMotionPreference((reduced) => {
      if (reduced) {
        html.classList.remove(STATE.motion);
        return;
      }
      html.classList.add(STATE.motion);

      const ctx = gsap.context(() => {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(sel(ATTR.reveal)),
        ).filter((el) => !el.closest("#home"));

        const groups = new Map<Element, HTMLElement[]>();
        for (const el of items) {
          const scope =
            el.parentElement?.closest(sel(ATTR.revealScope)) ?? el.parentElement;
          if (!scope) continue;
          const list = groups.get(scope);
          if (list) list.push(el);
          else groups.set(scope, [el]);
        }

        groups.forEach((els, scope) => {
          const keepVisible = scope.closest("#contact") !== null;
          gsap.set(els, { opacity: 0, y: FROM_Y });

          const show = (stagger: number) =>
            gsap.to(els, {
              opacity: 1,
              y: 0,
              duration: 1.1,
              ease: "expo.out",
              stagger,
              overwrite: true,
            });

          ScrollTrigger.create({
            trigger: scope,
            start: "top 78%",
            end: "bottom 22%",
            onEnter: () => show(0.07),
            onEnterBack: () => show(0.05),
            onLeave: () => {
              if (keepVisible) return;
              gsap.to(els, {
                opacity: 0,
                y: LEAVE_Y,
                duration: 0.6,
                ease: "power2.in",
                stagger: 0.03,
                overwrite: true,
              });
            },
            onLeaveBack: () => {
              gsap.to(els, {
                opacity: 0,
                y: FROM_Y,
                duration: 0.6,
                ease: "power2.in",
                stagger: 0.03,
                overwrite: true,
              });
            },
          });
        });
      });

      // Switches the CSS failsafe off: from here on GSAP drives the state.
      html.classList.add(STATE.revealReady);

      return () => {
        ctx.revert();
        html.classList.remove(STATE.revealReady);
      };
    });
  }, []);

  return null;
}
