import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, PrimaryGradient, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GuessHeaderProps {
  avatarEmoji: string;
  kicker: string;
  topicName: string;
}

/** Story-style avatar ring, "who you're guessing" line and the topic as a bold title. */
export function GuessHeader({ avatarEmoji, kicker, topicName }: GuessHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={PrimaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundElement, borderColor: theme.background }]}>
          <ThemedText style={styles.emoji}>{avatarEmoji}</ThemedText>
        </View>
      </LinearGradient>
      <ThemedText type="small" themeColor="textSecondary" style={styles.kicker}>
        {kicker}
      </ThemedText>
      <ThemedText style={styles.topic} numberOfLines={2}>
        {topicName}
      </ThemedText>
    </View>
  );
}

const RING = 72;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatar: {
    width: RING - 6,
    height: RING - 6,
    borderRadius: (RING - 6) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  kicker: {
    fontSize: 13,
  },
  topic: {
    fontFamily: FontFamily.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    textAlign: 'center',
    color: '#F5F5F7',
    borderRadius: Radius.pill,
  },
});
