import { Ionicons } from '@expo/vector-icons';
import { Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface TabItem {
  href: Href;
  isActive: (pathname: string) => boolean;
  icon: IconName;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  pathname: string;
  onSelect: (href: Href) => void;
}

/** Pill-shaped bar floating above the content; the active tab is a filled pill with its label. */
export function FloatingTabBar({ tabs, pathname, onSelect }: FloatingTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, Spacing.three) }]} pointerEvents="box-none">
      <View style={[styles.bar, { borderColor: theme.border }]}>
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Pressable
              key={tab.label}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(tab.href)}
              style={[styles.tab, active && { backgroundColor: theme.primary }]}>
              <Ionicons name={tab.icon} size={20} color={active ? theme.primaryText : theme.textSecondary} />
              {active ? (
                <ThemedText style={styles.label} themeColor="primaryText">
                  {tab.label}
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    maxWidth: 420,
    padding: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,20,26,0.92)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 48,
    minWidth: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 18,
  },
});
