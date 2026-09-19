import { Pressable, StyleSheet, View } from 'react-native';

import { StreakBadge } from '@/components/streak-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FriendRowProps {
  avatarEmoji: string;
  name: string;
  streak: number;
  pending?: boolean;
  subtitle?: string;
  hideStreak?: boolean;
  onPress: () => void;
}

export function FriendRow({
  avatarEmoji,
  name,
  streak,
  pending,
  subtitle,
  hideStreak,
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
      {!hideStreak && <StreakBadge streak={streak} pending={pending} />}
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
});
