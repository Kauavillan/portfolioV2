"use client";

import { useEffect, useRef } from "react";
import { useActiveSection } from "@hooks/useActiveSection";
import { subscribeProgress } from "@lib/section-tracker";
import styles from "@styles/Locator.module.scss";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Bottom-left locator (≥ 900px): `01 / 06 · <sector>` + scroll progress bar.
 * Sector names come from the DOM (`data-sector`), so it owns no strings. The bar
 * is driven imperatively: no React render per scroll pixel.
 */
export default function Locator() {
  const active = useActiveSection();
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      subscribeProgress((progress) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;
      }),
    [],
  );

  return (
    <div className={styles.locator} aria-hidden="true">
      <p className={styles.text}>
        {active.total > 0 ? (
          <>
            {pad(active.index + 1)} / {pad(active.total)}
            {active.sector ? ` · ${active.sector}` : ""}
          </>
        ) : (
          " "
        )}
      </p>
      <div className={styles.bar}>
        <span ref={fillRef} className={styles.fill} />
      </div>
    </div>
  );
}
