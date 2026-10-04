import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface TabItem {
  key: string;
  icon: IconName;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/** The active tab grows into a filled pill with its label; the others reflow with a spring. */
const REFLOW = LinearTransition.springify().damping(20).stiffness(220);

/** Pill-shaped bar floating above the content; the active tab is a filled pill with its label. */
export function FloatingTabBar({ tabs, activeKey, onSelect }: FloatingTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, Spacing.three) }]} pointerEvents="box-none">
      <View style={[styles.bar, { borderColor: theme.border }]}>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(tab.key)}
              hitSlop={4}>
              <Animated.View
                layout={REFLOW}
                style={[styles.tab, active && { backgroundColor: theme.backgroundSelected }]}>
                <Ionicons name={tab.icon} size={20} color={active ? theme.text : theme.textSecondary} />
                {active ? (
                  <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(100)}>
                    <ThemedText style={styles.label}>{tab.label}</ThemedText>
                  </Animated.View>
                ) : null}
              </Animated.View>
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
    backgroundColor: 'rgba(20,20,26,0.94)',
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
