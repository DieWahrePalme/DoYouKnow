import { useColorScheme as useSystemColorScheme } from 'react-native';

import { ColorScheme } from '@/constants/theme';
import { useAppearanceStore } from '@/state/appearanceStore';

/** The scheme in effect: the user's choice from Settings, or the system setting (dark if unknown). */
export function useColorScheme(): ColorScheme {
  const preference = useAppearanceStore((state) => state.preference);
  const system = useSystemColorScheme();

  if (preference !== 'system') return preference;
  return system === 'light' ? 'light' : 'dark';
}
