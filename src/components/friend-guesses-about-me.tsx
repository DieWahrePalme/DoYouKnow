import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ANSWER_LABELS, AnswerMap, Question, UserProfile } from '@/types';
import { formatPoints, guessOutcome, OUTCOME_ICONS, OUTCOME_POINTS } from '@/utils/guessScore';

export interface FriendGuess {
  friend: UserProfile;
  guess: AnswerMap;
  /** When the friend guessed today (ISO). */
  at: string;
}

const OUTCOME_SPOKEN = { exact: 'Richtig', direction: 'Halb richtig', wrong: 'Falsch' } as const;

const timeFormatter = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });

interface FriendGuessesAboutMeProps {
  questions: Question[];
  /** My current answers - what each friend's guess is scored against. */
  myAnswers: AnswerMap;
  friendGuesses: FriendGuess[];
}

/** On my own finished card: how each friend guessed me, question by question. */
export function FriendGuessesAboutMe({ questions, myAnswers, friendGuesses }: FriendGuessesAboutMeProps) {
  const theme = useTheme();

  if (friendGuesses.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: theme.border }]}>
        <Ionicons name="hourglass-outline" size={20} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
          Heute hat noch niemand deine Karte getippt.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {friendGuesses.map(({ friend, guess, at }) => {
        const points = questions.reduce(
          (sum, q) => sum + OUTCOME_POINTS[guessOutcome(guess[q.id], myAnswers[q.id])],
          0,
        );
        return (
          <View key={friend.id} accessible={false} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={styles.avatarEmoji}>{friend.avatarEmoji}</ThemedText>
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.name}>{friend.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  heute, {timeFormatter.format(new Date(at))} Uhr
                </ThemedText>
              </View>
              <View style={[styles.score, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={styles.scoreText}>
                  {formatPoints(points)}/{questions.length}
                </ThemedText>
              </View>
            </View>
            {questions.map((question) => {
              const outcome = guessOutcome(guess[question.id], myAnswers[question.id]);
              const icon = OUTCOME_ICONS[outcome];
              return (
                <View
                  key={question.id}
                  style={styles.row}
                  accessible
                  accessibilityLabel={`${OUTCOME_SPOKEN[outcome]}. ${question.text}. ${friend.name}: ${guess[question.id] ? ANSWER_LABELS[guess[question.id]] : 'keine Antwort'}, du: ${ANSWER_LABELS[myAnswers[question.id]]}`}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                  <View style={styles.rowText}>
                    <ThemedText type="small" style={styles.rowQuestion}>
                      {question.text}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.rowDetail}>
                      {friend.name}: {guess[question.id] ? ANSWER_LABELS[guess[question.id]] : '–'} · Du:{' '}
                      {ANSWER_LABELS[myAnswers[question.id]]}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 20, lineHeight: 26 },
  headerText: { flex: 1 },
  name: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
  score: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.pill },
  scoreText: { fontFamily: FontFamily.display, fontSize: 16, lineHeight: 20 },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  rowText: { flex: 1, gap: 1 },
  rowQuestion: { fontFamily: FontFamily.bodySemi },
  rowDetail: { fontSize: 12, lineHeight: 16 },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: { flex: 1 },
});
