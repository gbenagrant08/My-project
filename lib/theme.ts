export type AccentKey = 'gold' | 'crimson' | 'violet' | 'emerald' | 'azure';

export interface AccentDef {
  key: AccentKey;
  label: string;
  hex: string;
  soft: string;
  onAccent: string;
}

export const ACCENTS: AccentDef[] = [
  { key: 'gold', label: 'Premier Gold', hex: '#F0B429', soft: '#FFD67A', onAccent: '#1A1305' },
  { key: 'crimson', label: 'Velvet Crimson', hex: '#E23E57', soft: '#FF8A9C', onAccent: '#1C0509' },
  { key: 'violet', label: 'Noir Violet', hex: '#8B5CF6', soft: '#C4B5FD', onAccent: '#0F0722' },
  { key: 'emerald', label: 'Jade Emerald', hex: '#10B981', soft: '#6EE7B7', onAccent: '#03160F' },
  { key: 'azure', label: 'Neon Azure', hex: '#38BDF8', soft: '#7DD3FC', onAccent: '#04131C' },
];

export const base = {
  bg: '#0C0C12',
  bgDeep: '#08080C',
  elevated: '#12121B',
  surface: '#171722',
  surfaceAlt: '#1F1F2C',
  border: '#272734',
  borderSoft: '#1D1D28',
  text: '#F7F6F3',
  textDim: '#A7A7B5',
  textFaint: '#6E6E7E',
  white: '#FFFFFF',
  black: '#000000',
  star: '#FFC53D',
  success: '#3DDC97',
  danger: '#FF5A6A',
  scrim: 'rgba(8,8,12,0.72)',
};

export const fonts = {
  display: 'PlayfairDisplay-Bold',
  displayBlack: 'PlayfairDisplay-Black',
  displaySemi: 'PlayfairDisplay-SemiBold',
  displayMedium: 'PlayfairDisplay-Medium',
  black: 'Outfit-ExtraBold',
  bold: 'Outfit-Bold',
  semi: 'Outfit-SemiBold',
  medium: 'Outfit-Medium',
  regular: 'Outfit-Regular',
  light: 'Outfit-Light',
  tech: 'SpaceGrotesk-Bold',
  techMedium: 'SpaceGrotesk-Medium',
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type ThemeColors = typeof base & {
  accent: string;
  accentSoft: string;
  accentDim: string;
  accentLine: string;
  accentText: string;
};

export interface Theme {
  colors: ThemeColors;
  fonts: typeof fonts;
  radius: typeof radius;
  space: typeof space;
  accent: AccentDef;
}

export function rgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function makeTheme(key: AccentKey): Theme {
  const accent = ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
  return {
    colors: {
      ...base,
      accent: accent.hex,
      accentSoft: accent.soft,
      accentDim: rgba(accent.hex, 0.15),
      accentLine: rgba(accent.hex, 0.38),
      accentText: accent.onAccent,
    },
    fonts,
    radius,
    space,
    accent,
  };
}
