import { StyleSheet, ViewStyle } from 'react-native';
import { radius, space, colors } from '../theme';

/** Shadow-only container: use as outer wrapper. No overflow. */
export function cardShadowContainer(
  borderRadiusKey: keyof typeof radius = '2xl',
  options?: { marginBottom?: number; shadowColor?: string; shadowOpacity?: number; shadowRadius?: number; elevation?: number }
): ViewStyle {
  const r = radius[borderRadiusKey];
  return {
    marginBottom: options?.marginBottom ?? space.md,
    borderRadius: r,
    backgroundColor: 'transparent',
    shadowColor: options?.shadowColor ?? '#000',
    shadowOpacity: options?.shadowOpacity ?? 0.08,
    shadowRadius: options?.shadowRadius ?? 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: options?.elevation ?? 4,
  };
}

/** Clipping container: overflow hidden + bg. Use as inner wrapper; put Image and content inside. */
export function cardClipContainer(
  borderRadiusKey: keyof typeof radius = '2xl',
  backgroundColor: string = colors.bgCharcoal
): ViewStyle {
  return {
    borderRadius: radius[borderRadiusKey],
    overflow: 'hidden' as const,
    backgroundColor,
  };
}

/** Prebuilt StyleSheet entries for common card radii (avoids creating new objects every render). */
export const cardLayerStyles = StyleSheet.create({
  shadowContainer2xl: {
    marginBottom: space.md,
    borderRadius: radius['2xl'],
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shadowContainerXl: {
    marginBottom: space.md,
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardContainer2xl: {
    borderRadius: radius['2xl'],
    overflow: 'hidden' as const,
    backgroundColor: colors.bgCharcoal,
  },
  cardContainerXl: {
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    backgroundColor: colors.bgCharcoal,
  },
});
