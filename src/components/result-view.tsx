import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ANSWER_LABELS, AnswerMap, Question } from '@/types';
import { formatPoints, guessOutcome, OUTCOME_ICONS, OUTCOME_POINTS } from '@/utils/guessScore';

const OUTCOME_SPOKEN = { exact: 'Richtig', direction: 'Halb richtig', wrong: 'Falsch' } as const;

interface ResultViewProps {
  subjectName: string;
  questions: Question[];
  guesses: AnswerMap;
  truth?: AnswerMap;
}

export function ResultView({ subjectName, questions, guesses, truth }: ResultViewProps) {
  const theme = useTheme();

  if (!truth) {
    return (
      <View style={[styles.waitingCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="hourglass-outline" size={36} color={theme.textSecondary} />
        <ThemedText style={styles.waitingTitle}>Warte auf {subjectName}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Sobald {subjectName} die eigenen Fragen des Tages beantwortet hat, siehst du hier sofort deine
          Auflösung.
        </ThemedText>
      </View>
    );
  }

  // Exact answer = 1 point, right direction (Ja/Eher ja, Nein/Eher nein) = half a point.
  const points = questions.reduce((sum, q) => sum + OUTCOME_POINTS[guessOutcome(guesses[q.id], truth[q.id])], 0);

  return (
    <View style={styles.resultWrap}>
      <View
        style={styles.score}
        accessible
        accessibilityLabel={`${formatPoints(points)} von ${questions.length} richtig geraten über ${subjectName}`}>
        <ThemedText style={styles.scoreValue}>
          {formatPoints(points)}/{questions.length}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          richtig geraten über {subjectName}
        </ThemedText>
      </View>

      <View style={[styles.list, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {questions.map((question, i) => {
          const outcome = guessOutcome(guesses[question.id], truth[question.id]);
          const icon = OUTCOME_ICONS[outcome];
          return (
            <View
              key={question.id}
              accessible
              accessibilityLabel={`${OUTCOME_SPOKEN[outcome]}. ${question.text}. Du: ${ANSWER_LABELS[guesses[question.id]]}, ${subjectName}: ${ANSWER_LABELS[truth[question.id]]}`}
              style={[styles.row, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Ionicons name={icon.name} size={22} color={theme[icon.color]} />
              <View style={styles.rowText}>
                <ThemedText style={styles.rowQuestion}>{question.text}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rowDetail}>
                  Du: {ANSWER_LABELS[guesses[question.id]]} · {subjectName}: {ANSWER_LABELS[truth[question.id]]}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waitingCard: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  waitingTitle: { fontFamily: FontFamily.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  centerText: { textAlign: 'center' },
  resultWrap: { gap: Spacing.four },
  score: { alignItems: 'center', gap: 2 },
  scoreValue: { fontFamily: FontFamily.display, fontSize: 64, lineHeight: 68, letterSpacing: -2 },
  list: { borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, padding: Spacing.three },
  rowText: { flex: 1, gap: 2 },
  rowQuestion: { fontFamily: FontFamily.bodySemi, fontSize: 15, lineHeight: 21 },
  rowDetail: { fontSize: 12, lineHeight: 16 },
});
