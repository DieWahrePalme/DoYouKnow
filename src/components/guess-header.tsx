import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, PrimaryGradient, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GuessHeaderProps {
  avatarEmoji: string;
  kicker: string;
  topicName: string;
}

/** One compact row: story-style avatar ring, then the topic as title with a small kicker above it. */
export function GuessHeader({ avatarEmoji, kicker, topicName }: GuessHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <LinearGradient accessibilityElementsHidden importantForAccessibility="no-hide-descendants" colors={PrimaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundElement, borderColor: theme.background }]}>
          <ThemedText style={styles.emoji}>{avatarEmoji}</ThemedText>
        </View>
      </LinearGradient>
      <View style={styles.text}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.kicker} numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {kicker}
        </ThemedText>
        <ThemedText style={styles.topic} numberOfLines={1} accessibilityRole="header" maxFontSizeMultiplier={1.5}>
          {topicName}
        </ThemedText>
      </View>
    </View>
  );
}

const RING = 48;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: RING - 5,
    height: RING - 5,
    borderRadius: (RING - 5) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  text: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 15,
  },
  topic: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
});
