/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0B0F',
    background: '#F5F5F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECEBFB',
    textSecondary: '#6B6D76',
    primary: '#6C5CE7',
    primaryText: '#FFFFFF',
    border: '#E4E3EC',
    success: '#1DBF73',
    danger: '#FF3B5C',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0A0A0C',
    backgroundElement: '#18181C',
    backgroundSelected: '#242430',
    textSecondary: '#9A9AA5',
    primary: '#8B7CF8',
    primaryText: '#FFFFFF',
    border: '#2A2A32',
    success: '#2ED573',
    danger: '#FF4D6D',
  },
} as const;

/** Gradient stops for the primary CTA / hero surfaces, Revolut-style. */
export const PrimaryGradient = ['#6C5CE7', '#FF4D8D'] as const;

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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
