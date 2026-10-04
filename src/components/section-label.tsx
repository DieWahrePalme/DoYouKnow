import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/** Small uppercase label above a card group. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label} accessibilityRole="header">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
});
