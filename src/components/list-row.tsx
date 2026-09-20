import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ListRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress: () => void;
}

export function ListRow({ icon, title, subtitle, trailing, onPress }: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={styles.iconText}>{icon}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText type="default" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing}
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
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
});
