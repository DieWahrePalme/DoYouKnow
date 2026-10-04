/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Every colour a component may ask for; both schemes define all of them. */
export interface Palette {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  /** Accent used for text/links (the plain accent is too dark for text on the dark scheme). */
  textAccent: string;
  primary: string;
  primaryText: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  placeholder: string;
  /** Floating tab bar surface (slightly see-through). */
  barBackground: string;
  /** Outlined buttons: a hint of surface so the field behind doesn't cut through the label. */
  glass: string;
  /** Veil laid over the cards further back in the swipe stack. */
  layerShade: string;
}

/**
 * Two schemes, same structure: neutral surfaces and text, one accent. The
 * animated field behind the app carries the colour (see field-variants.ts).
 */
const dark: Palette = {
  text: '#F5F5F7',
  background: '#07070B',
  backgroundElement: '#14141A',
  backgroundSelected: '#1D1D26',
  textSecondary: '#8D8D9B',
  textAccent: '#9D8FFF',
  primary: '#6A5AF9',
  primaryText: '#FFFFFF',
  border: '#24242E',
  success: '#3DDC97',
  warning: '#FFC857',
  danger: '#FF5470',
  placeholder: '#85859A',
  barBackground: 'rgba(20,20,26,0.94)',
  glass: 'rgba(20,20,26,0.6)',
  layerShade: '#07070B',
};

const light: Palette = {
  text: '#0E0E14',
  background: '#F4F4F8',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#E9E9F1',
  textSecondary: '#5E5E6D',
  textAccent: '#5445E0',
  primary: '#6A5AF9',
  primaryText: '#FFFFFF',
  border: '#DADAE5',
  success: '#12905C',
  warning: '#B97A00',
  danger: '#D3304D',
  placeholder: '#6E6E7D',
  barBackground: 'rgba(255,255,255,0.94)',
  glass: 'rgba(255,255,255,0.7)',
  layerShade: '#C8C8D6',
};

export const Colors = { light, dark } as const;

export type ColorScheme = keyof typeof Colors;

/** Gradient stops for the brand mark (same in both schemes). */
export const PrimaryGradient = ['#4F7BFF', '#8A5CFF'] as const;

export type ThemeColor = keyof Palette;

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
