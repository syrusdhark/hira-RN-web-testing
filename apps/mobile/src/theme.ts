export const space = {
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const colors = {
  bgMidnight: '#000000',
  bgCharcoal: '#0C0D0E',
  bgElevated: '#141517',
  /** Gradient background: top (subtle violet-tinted) to bottom (black). */
  bgGradientTop: '#0F0C18',
  bgGradientBottom: '#000000',
  borderSubtle: '#1A1B1E',
  borderDefault: '#26272B',
  primaryViolet: '#8A70FF',
  primaryIndigo: '#5C8DFF',
  healthGreen: '#2DFF8F',
  actionAmber: '#FFB000',
  bodyOrange: '#FF5C00',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textInverse: '#000000',
  brandBlue: '#00F0FF',
  tabAccentRose: '#fb7185',
} as const;

export const typography = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 28, lineHeight: 36 },
  '3xl': { fontSize: 36, lineHeight: 44 },
  '4xl': { fontSize: 64, lineHeight: 72 },
} as const;

