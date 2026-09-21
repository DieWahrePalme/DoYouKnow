import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <ThemedText type="smallBold" style={streak === 0 ? styles.extinguished : undefined}>
      🔥 {streak}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  extinguished: {
    opacity: 0.35,
  },
});
