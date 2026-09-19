import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ANSWER_LABELS, AnswerMap, Question } from '@/types';

interface ResultViewProps {
  subjectName: string;
  questions: Question[];
  guesses: AnswerMap;
  truth?: AnswerMap;
}

export function ResultView({ subjectName, questions, guesses, truth }: ResultViewProps) {
  if (!truth) {
    return (
      <ThemedView type="backgroundElement" style={styles.waitingCard}>
        <ThemedText style={styles.hourglassBig}>⏳</ThemedText>
        <ThemedText type="subtitle" style={styles.centerText}>
          Warte auf {subjectName}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
          Sobald {subjectName} die eigenen Fragen des Tages beantwortet hat, siehst du hier sofort deine
          Auflösung.
        </ThemedText>
      </ThemedView>
    );
  }

  const correctCount = questions.filter((q) => guesses[q.id] === truth[q.id]).length;

  return (
    <View style={styles.resultWrap}>
      <ThemedView type="backgroundElement" style={styles.scoreCard}>
        <ThemedText type="title" style={styles.centerText}>
          {correctCount} / {questions.length}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
          richtig geraten über {subjectName}
        </ThemedText>
      </ThemedView>

      {questions.map((question) => {
        const isCorrect = guesses[question.id] === truth[question.id];
        return (
          <View key={question.id} style={styles.row}>
            <ThemedText style={styles.rowIcon}>{isCorrect ? '✅' : '❌'}</ThemedText>
            <View style={styles.rowText}>
              <ThemedText type="small">{question.text}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Deine Vermutung: {ANSWER_LABELS[guesses[question.id]]} · {subjectName}:{' '}
                {ANSWER_LABELS[truth[question.id]]}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  waitingCard: {
    borderRadius: Spacing.four,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  hourglassBig: {
    fontSize: 40,
  },
  centerText: {
    textAlign: 'center',
  },
  resultWrap: {
    gap: Spacing.three,
  },
  scoreCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  rowIcon: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
