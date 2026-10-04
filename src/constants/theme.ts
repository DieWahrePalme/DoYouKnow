/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Dark-only palette. Surfaces and text stay neutral; blue -> violet is
 * reserved for the background field and the single accent (primary).
 */
const dark = {
  text: '#F5F5F7',
  background: '#07070B',
  backgroundElement: '#14141A',
  backgroundSelected: '#1D1D26',
  textSecondary: '#8D8D9B',
  primary: '#6A5AF9',
  primaryText: '#FFFFFF',
  border: '#24242E',
  success: '#3DDC97',
  danger: '#FF5470',
} as const;

export const Colors = { light: dark, dark } as const;

/** Blue -> violet stops used by the animated background field. */
export const FieldColors = {
  base: '#07070B',
  blue: '#2F6BFF',
  violet: '#8A5CFF',
} as const;

/** Readable placeholder colour on the dark surfaces (>= 4.5:1). */
export const PLACEHOLDER_COLOR = '#85859A';

/** Gradient stops for hero surfaces (kept for primary CTA fallbacks). */
export const PrimaryGradient = ['#4F7BFF', '#8A5CFF'] as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Display + body families, loaded in the root layout (see src/app/_layout.tsx). */
export const FontFamily = {
  display: 'BricolageGrotesque_800ExtraBold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Corner radii: cards, pills (fully round) and small chips. */
export const Radius = {
  chip: 12,
  card: 24,
  pill: 999,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Height the floating tab bar occupies above the bottom safe area. */
export const BottomTabInset = 96;
export const MaxContentWidth = 800;
