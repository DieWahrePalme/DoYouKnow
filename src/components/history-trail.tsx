import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { ANSWER_LABELS, AnswerEntry } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

interface HistoryTrailProps {
  questionText: string;
  entries: AnswerEntry[];
}

export function HistoryTrail({ questionText, entries }: HistoryTrailProps) {
  const now = useEffectiveNow();
  const past = entries.slice(0, -1);
  const latest = entries[entries.length - 1];

  return (
    <View style={styles.wrap}>
      <ThemedText type="small">{questionText}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {now
          ? past.map((entry) => `${formatRelative(entry.at, now)}: ${ANSWER_LABELS[entry.value]}`).join(' → ')
          : ''}
        {now && past.length > 0 ? ' → ' : ''}
        <ThemedText type="smallBold">
          {now ? `${formatRelative(latest.at, now)}: ` : ''}
          {ANSWER_LABELS[latest.value]}
        </ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    paddingVertical: Spacing.one,
  },
});
