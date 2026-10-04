/** The app is dark-only (see docs/DESIGN-SYSTEM.md), so there is no scheme switch. */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.dark;
}
