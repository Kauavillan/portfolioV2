"use client";

import { useTranslations } from "next-intl";
import { ATTR, attr } from "@lib/contract";
import { useUiStore } from "@stores/useUiStore";
import styles from "@styles/Hud.module.scss";

export const NAV_RAIL_ID = "nav-rail";

/** Menu ↔ Close button of the mobile overlay (hidden from 900px up). */
export default function MenuToggle() {
  const t = useTranslations("Hud");
  const open = useUiStore((s) => s.navOpen);
  const toggle = useUiStore((s) => s.toggleNav);

  return (
    <button
      type="button"
      className={styles.menu}
      {...attr(ATTR.menuToggle)}
      aria-expanded={open}
      aria-controls={NAV_RAIL_ID}
      onClick={toggle}
    >
      {open ? t("menu.close") : t("menu.open")}
    </button>
  );
}
