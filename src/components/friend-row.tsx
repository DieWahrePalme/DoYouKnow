import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { StreakBadge } from '@/components/streak-badge';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusIcon = 'checkmark' | 'hourglass' | 'alert' | 'ellipse-outline';

/** What each status icon means, for screen readers (the icon alone says nothing). */
const STATUS_SPOKEN: Record<StatusIcon, string> = {
  checkmark: 'Aufgelöst',
  hourglass: 'Wartet auf die Antwort',
  alert: 'Läuft bald ab, noch offen',
  'ellipse-outline': 'Noch offen',
};

interface FriendRowProps {
  avatarEmoji: string;
  name: string;
  streak: number;
  subtitle?: string;
  hideStreak?: boolean;
  /** Today's resolution status, shown as a small tinted circle. */
  statusIcon?: StatusIcon;
  statusTone?: ThemeColor;
  onPress: () => void;
}

/** One row inside a grouped card: transparent, the surrounding card supplies the surface. */
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
  const tone = theme[statusTone ?? 'textSecondary'];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        subtitle,
        hideStreak ? null : `${streak} Tage Streak`,
        statusIcon ? STATUS_SPOKEN[statusIcon] : null,
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={styles.avatarEmoji}>{avatarEmoji}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText style={styles.name} maxFontSizeMultiplier={1.6}>
          {name}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {!hideStreak && <StreakBadge streak={streak} />}
      {statusIcon ? (
        <View style={[styles.statusChip, { backgroundColor: `${tone}26` }]}>
          <Ionicons name={statusIcon} size={16} color={tone} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24, lineHeight: 30 },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
  statusChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
