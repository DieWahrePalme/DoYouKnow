import { StyleSheet, View } from 'react-native';

import { AnswerChip } from '@/components/answer-chip';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { ANSWER_LABELS, AnswerEntry } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

interface HistoryTrailProps {
  questionText: string;
  entries: AnswerEntry[];
}

/** One answered question: the text, the current answer as a chip, and (if it changed) what it used to be. */
export function HistoryTrail({ questionText, entries }: HistoryTrailProps) {
  const now = useEffectiveNow();
  const past = entries.slice(0, -1);
  const latest = entries[entries.length - 1];

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <ThemedText style={styles.question}>{questionText}</ThemedText>
        {now && past.length > 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.past}>
            Davor: {past.map((entry) => `${ANSWER_LABELS[entry.value]} (${formatRelative(entry.at, now)})`).join(', ')}
          </ThemedText>
        ) : null}
      </View>
      <AnswerChip value={latest.value} />
    </View>
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
  text: { flex: 1, gap: 3 },
  question: { fontFamily: FontFamily.bodySemi, fontSize: 15, lineHeight: 21 },
  past: { fontSize: 12, lineHeight: 16 },
});
