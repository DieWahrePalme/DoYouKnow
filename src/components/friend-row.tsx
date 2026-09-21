import { Pressable, StyleSheet, View } from 'react-native';

import { StreakBadge } from '@/components/streak-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FriendRowProps {
  avatarEmoji: string;
  name: string;
  streak: number;
  subtitle?: string;
  hideStreak?: boolean;
  /** Small colored badge next to the streak showing today's resolution status - see StatusChip below. */
  statusIcon?: string;
  statusTone?: ThemeColor;
  onPress: () => void;
}

export function FriendRow({
  avatarEmoji,
  name,
  streak,
  subtitle,
  hideStreak,
  statusIcon,
  statusTone,
  onPress,
}: FriendRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={styles.avatarEmoji}>{avatarEmoji}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText type="default" style={styles.name}>
          {name}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {statusIcon ? (
        <View style={[styles.statusChip, { backgroundColor: `${theme[statusTone ?? 'textSecondary']}26` }]}>
          <ThemedText style={styles.statusIcon}>{statusIcon}</ThemedText>
        </View>
      ) : null}
      {!hideStreak && <StreakBadge streak={streak} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  statusChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 14,
  },
});
