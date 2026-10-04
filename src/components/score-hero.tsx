import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScoreHeroProps {
  /** 0-100, or null when nothing is comparable yet. */
  percent: number | null;
  caption: string;
}

/** Big centred percentage with a thin progress bar and a caption. */
export function ScoreHero({ percent, caption }: ScoreHeroProps) {
  const theme = useTheme();

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={percent === null ? `Noch kein Match. ${caption}` : `${percent} Prozent Match. ${caption}`}>
      <ThemedText style={styles.value}>{percent === null ? '–' : `${percent}%`}</ThemedText>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { backgroundColor: theme.primary, width: `${percent ?? 0}%` }]} />
      </View>
      <ThemedText themeColor="textSecondary" style={styles.caption}>
        {caption}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  value: {
    fontFamily: FontFamily.display,
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -3,
  },
  track: { alignSelf: 'stretch', height: 6, borderRadius: Radius.pill, overflow: 'hidden', marginHorizontal: Spacing.four },
  fill: { height: 6, borderRadius: Radius.pill },
  caption: { textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: Spacing.three },
});
