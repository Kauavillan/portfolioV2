"use client";

import { useEffect } from "react";
import { useScreenSizeStore } from "@/stores/useScreenSizeStore";

interface ScreenSizeProviderProps {
  children: React.ReactNode;
}

export function ScreenSizeProvider({ children }: ScreenSizeProviderProps) {
  const { setScreenSize } = useScreenSizeStore();

  useEffect(() => {
    // Function to update screen size
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial screen size
    updateScreenSize();

    window.addEventListener("resize", updateScreenSize);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
    };
  }, [setScreenSize]);

  return <>{children}</>;
}
