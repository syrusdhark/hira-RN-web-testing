import { useWindowDimensions } from 'react-native';

const BREAKPOINT_SMALL = 380;
const BREAKPOINT_TABLET = 768;

/**
 * Responsive breakpoints for layout and typography.
 * Use in screens that need to adapt to small phones, tablets, or desktop.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    width,
    isSmall: width < BREAKPOINT_SMALL,
    isTablet: width > BREAKPOINT_TABLET,
  };
}
