import { create } from "zustand";

export interface ScreenSize {
  width: number;
  height: number;
}

export interface Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

interface ScreenSizeState {
  screenSize: ScreenSize;
  breakpoints: Breakpoints;
  setScreenSize: (size: ScreenSize) => void;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

const calculateBreakpoints = (width: number): Breakpoints => ({
  isMobile: width < BREAKPOINTS.mobile,
  isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
  isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
  isLargeDesktop: width >= BREAKPOINTS.desktop,
});

export const useScreenSizeStore = create<ScreenSizeState>((set) => ({
  screenSize: {
    width: 0,
    height: 0,
  },
  breakpoints: {
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
  },
  setScreenSize: (size: ScreenSize) =>
    set({
      screenSize: size,
      breakpoints: calculateBreakpoints(size.width),
    }),
}));
