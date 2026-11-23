"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ATTR, BREAKPOINT_DESKTOP, SECTION_IDS, STATE, attr, sel } from "@lib/contract";
import { useActiveSection } from "@hooks/useActiveSection";
import { useUiStore } from "@stores/useUiStore";
import { NAV_RAIL_ID } from "./MenuToggle";
import styles from "@styles/NavRail.module.scss";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Section navigation. ≥ 900px: fixed rail on the right. < 900px: full-screen
 * overlay opened by the Menu button (`html.nav-open`).
 *
 * Clicks on the links are handled by <AnchorController/>, which also closes
 * the menu before scrolling.
 */
export default function NavRail() {
  const t = useTranslations("Hud");
  const active = useActiveSection();
  const open = useUiStore((s) => s.navOpen);
  const setOpen = useUiStore((s) => s.setNavOpen);
  const listRef = useRef<HTMLUListElement>(null);

  // `html.nav-open`, inert background and focus management.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle(STATE.navOpen, open);
    if (!open) return;

    const background = document.querySelectorAll<HTMLElement>("main, footer");
    background.forEach((el) => el.setAttribute("inert", ""));
    const frame = window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(sel(ATTR.nav))?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Return focus to the button that opened the menu.
      document.querySelector<HTMLElement>(sel(ATTR.menuToggle))?.focus();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      background.forEach((el) => el.removeAttribute("inert"));
      html.classList.remove(STATE.navOpen);
    };
  }, [open, setOpen]);

  // Growing past the breakpoint turns the overlay into the rail: close the menu.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT_DESKTOP}px)`);
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setOpen]);

  return (
    <nav id={NAV_RAIL_ID} className={styles.rail} aria-label={t("nav.label")}>
      <ul ref={listRef}>
        {SECTION_IDS.map((id, i) => (
          <li key={id}>
            <a
              href={`#${id}`}
              {...attr(ATTR.nav)}
              aria-current={active.id === id ? "true" : undefined}
            >
              <span className={styles.index}>{pad(i + 1)}</span>
              <span className={styles.name}>{t(`nav.${id}`)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
