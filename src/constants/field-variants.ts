import { ColorScheme } from '@/constants/theme';

/** One look of the animated background field. Colours are 0-1 RGB. */
export interface FieldVariant {
  colorA: readonly [number, number, number];
  colorB: readonly [number, number, number];
  /** Contour density: more levels = more, closer lines. Kept low on purpose (calm, simple). */
  levels: number;
  /** Soft halo around each line; 0 = crisp lines. */
  glow: number;
  /** Line thickness multiplier. */
  width: number;
  /** Line strength per scheme (the light scheme needs more to show against white). */
  intensity: Record<ColorScheme, number>;
  /** Soft colour glow at the top of the screen per scheme. */
  wash: Record<ColorScheme, number>;
}

export type FieldVariantName = 'home' | 'match' | 'favorites' | 'profile';

/** Field base colour per scheme (0-1 RGB), matching `background` in the palette. */
export const FIELD_BASE: Record<ColorScheme, readonly [number, number, number]> = {
  dark: [0.027, 0.027, 0.043],
  light: [0.957, 0.957, 0.973],
};

export const FIELD_VARIANTS: Record<FieldVariantName, FieldVariant> = {
  /** Blue/violet. */
  home: {
    colorA: [0.18, 0.42, 1.0],
    colorB: [0.54, 0.36, 1.0],
    levels: 6,
    glow: 0.06,
    width: 1.0,
    intensity: { dark: 0.3, light: 0.5 },
    wash: { dark: 0.14, light: 0.13 },
  },
  /** Red. */
  match: {
    colorA: [1.0, 0.22, 0.26],
    colorB: [1.0, 0.45, 0.22],
    levels: 8,
    glow: 0.0,
    width: 0.8,
    intensity: { dark: 0.34, light: 0.55 },
    wash: { dark: 0.12, light: 0.12 },
  },
  /** Teal. */
  favorites: {
    colorA: [0.1, 0.82, 0.68],
    colorB: [0.16, 0.5, 1.0],
    levels: 5,
    glow: 0.08,
    width: 1.1,
    intensity: { dark: 0.28, light: 0.55 },
    wash: { dark: 0.12, light: 0.14 },
  },
  /** Magenta. */
  profile: {
    colorA: [0.92, 0.3, 0.78],
    colorB: [0.55, 0.35, 1.0],
    levels: 6,
    glow: 0.02,
    width: 0.9,
    intensity: { dark: 0.32, light: 0.5 },
    wash: { dark: 0.13, light: 0.12 },
  },
};

/** Tab route -> variant. Other routes (stack screens) keep whichever tab look they were opened from. */
export function variantForPath(rawPath: string): FieldVariantName | null {
  const pathname = rawPath.replace(/^\/design-preview(?=\/)/, '') || '/';
  if (pathname === '/guess') return 'home';
  if (pathname === '/' || pathname === '/home') return 'home';
  if (pathname === '/match') return 'match';
  if (pathname === '/favorites') return 'favorites';
  if (pathname === '/profile') return 'profile';
  return null;
}

/** Flat number form used for interpolation on the UI thread. */
export function variantToArray(v: FieldVariant, scheme: ColorScheme): number[] {
  return [
    ...v.colorA,
    ...v.colorB,
    v.levels,
    v.glow,
    v.width,
    v.intensity[scheme],
    v.wash[scheme],
    ...FIELD_BASE[scheme],
  ];
}
