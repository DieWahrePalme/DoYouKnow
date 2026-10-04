import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ListRowProps {
  /** Emoji for content (an avatar, a topic); use `iconName` for UI icons. */
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  /** Chevron on the right; on by default when there is no `trailing`. */
  chevron?: boolean;
  danger?: boolean;
  onPress: () => void;
}

/** Tappable row meant to sit inside a GroupedCard. */
export function ListRow({ icon, iconName, title, subtitle, trailing, chevron, danger, onPress }: ListRowProps) {
  const theme = useTheme();
  const tint = danger ? theme.danger : theme.text;
  const showChevron = chevron ?? !trailing;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
        {iconName ? (
          <Ionicons name={iconName} size={20} color={tint} />
        ) : (
          <ThemedText style={styles.iconText}>{icon}</ThemedText>
        )}
      </View>
      <View style={styles.info}>
        <ThemedText style={[styles.title, danger && { color: theme.danger }]}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /> : null}
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    lineHeight: 26,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 16,
    lineHeight: 22,
  },
});
