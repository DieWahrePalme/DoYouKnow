/** One look of the animated background field. Colours are 0-1 RGB. */
export interface FieldVariant {
  colorA: readonly [number, number, number];
  colorB: readonly [number, number, number];
  /** Contour density: more levels = more, closer lines. */
  levels: number;
  /** Soft halo around each line; high values read as "water", 0 as crisp topo lines. */
  glow: number;
  /** Line thickness multiplier. */
  width: number;
  /** Overall brightness of the field; kept low so content stays in front. */
  intensity: number;
}

export type FieldVariantName = 'home' | 'match' | 'favorites' | 'profile';

export const FIELD_VARIANTS: Record<FieldVariantName, FieldVariant> = {
  /** Blue/violet water. */
  home: { colorA: [0.18, 0.42, 1.0], colorB: [0.54, 0.36, 1.0], levels: 11, glow: 0.14, width: 1.2, intensity: 0.36 },
  /** Red topographic lines. */
  match: { colorA: [1.0, 0.22, 0.26], colorB: [1.0, 0.45, 0.22], levels: 19, glow: 0.0, width: 0.75, intensity: 0.4 },
  /** Teal water. */
  favorites: { colorA: [0.1, 0.82, 0.68], colorB: [0.16, 0.5, 1.0], levels: 8, glow: 0.16, width: 1.3, intensity: 0.32 },
  /** Magenta lines. */
  profile: { colorA: [0.92, 0.3, 0.78], colorB: [0.55, 0.35, 1.0], levels: 14, glow: 0.04, width: 0.9, intensity: 0.38 },
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
export function variantToArray(v: FieldVariant): number[] {
  return [...v.colorA, ...v.colorB, v.levels, v.glow, v.width, v.intensity];
}
