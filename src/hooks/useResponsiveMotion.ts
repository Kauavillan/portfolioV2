"use client";

import { useEffect, useMemo, useState } from "react";

const MOBILE_MAX_WIDTH = 767;

export type ResponsiveMotion = {
  isMobile: boolean;
  isReady: boolean;
  motionKey: "ssr" | "mobile" | "desktop";
};

export function useResponsiveMotion(
  maxMobileWidth: number = MOBILE_MAX_WIDTH,
): ResponsiveMotion {
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxMobileWidth}px)`);

    const update = () => {
      setIsMobile(media.matches);
      setIsReady(true);
    };

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    // Fallback for older browsers that don't support MediaQueryList.addEventListener
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [maxMobileWidth]);

  const motionKey = useMemo<ResponsiveMotion["motionKey"]>(() => {
    if (!isReady) return "ssr";
    return isMobile ? "mobile" : "desktop";
  }, [isMobile, isReady]);

  return { isMobile, isReady, motionKey };
}
