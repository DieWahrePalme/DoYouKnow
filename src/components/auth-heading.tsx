import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';

interface AuthHeadingProps {
  title: string;
  subtitle?: string;
}

/** Big display title with a quiet line underneath, left aligned, used at the top of every auth step. */
export function AuthHeading({ title, subtitle }: AuthHeadingProps) {
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
    color: '#F5F5F7',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
  },
});
