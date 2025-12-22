import { useScreenSizeStore } from "@/stores";

/**
 * Custom hook to access screen size information
 * @returns Object containing screen size and breakpoint information
 */
export const useScreenSize = () => {
  const { screenSize, breakpoints } = useScreenSizeStore();

  return {
    ...screenSize,
    ...breakpoints,
    screenSize,
    breakpoints,
  };
};
