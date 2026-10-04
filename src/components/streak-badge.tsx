import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StreakBadgeProps {
  streak: number;
}

const FLAME_ACTIVE = '#FF8A3D';

/** Flame icon + count; greyed out at 0. */
export function StreakBadge({ streak }: StreakBadgeProps) {
  const theme = useTheme();
  const out = streak === 0;
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${streak} Tage Streak`}>
      <Ionicons name="flame" size={18} color={out ? theme.textSecondary : FLAME_ACTIVE} />
      <ThemedText style={[styles.count, out && styles.out]} maxFontSizeMultiplier={1.4}>
        {streak}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { fontFamily: FontFamily.bodyBold, fontSize: 15, lineHeight: 20 },
  out: { opacity: 0.75 },
});
