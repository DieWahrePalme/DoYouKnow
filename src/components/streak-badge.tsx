import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface StreakBadgeProps {
  streak: number;
  pending?: boolean;
}

export function StreakBadge({ streak, pending }: StreakBadgeProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={streak === 0 ? styles.extinguished : undefined}>
        🔥 {streak}
      </ThemedText>
      {pending ? <ThemedText type="small">⏳</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  extinguished: {
    opacity: 0.35,
  },
});
