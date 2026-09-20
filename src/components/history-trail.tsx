import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ANSWER_LABELS, AnswerEntry } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

interface HistoryTrailProps {
  questionText: string;
  entries: AnswerEntry[];
}

export function HistoryTrail({ questionText, entries }: HistoryTrailProps) {
  const past = entries.slice(0, -1);
  const latest = entries[entries.length - 1];

  return (
    <View style={styles.wrap}>
      <ThemedText type="small">{questionText}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {past.map((entry) => `${formatRelative(entry.at)}: ${ANSWER_LABELS[entry.value]}`).join(' → ')}
        {past.length > 0 ? ' → ' : ''}
        <ThemedText type="smallBold">
          {formatRelative(latest.at)}: {ANSWER_LABELS[latest.value]}
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
