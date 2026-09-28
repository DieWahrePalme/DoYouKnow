import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ANSWER_LABELS, AnswerMap, Question, UserProfile } from '@/types';
import { formatPoints, guessOutcome, OUTCOME_ICONS, OUTCOME_POINTS } from '@/utils/guessScore';

export interface FriendGuess {
  friend: UserProfile;
  guess: AnswerMap;
  /** When the friend guessed today (ISO). */
  at: string;
}

const timeFormatter = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });

interface FriendGuessesAboutMeProps {
  questions: Question[];
  /** My current answers - what each friend's guess is scored against. */
  myAnswers: AnswerMap;
  friendGuesses: FriendGuess[];
}

/** On my own finished card: how each friend guessed me, question by question. */
export function FriendGuessesAboutMe({ questions, myAnswers, friendGuesses }: FriendGuessesAboutMeProps) {
  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold">So haben dich deine Freunde heute eingeschätzt</ThemedText>
      {friendGuesses.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Heute hat noch niemand deine Karte getippt.
        </ThemedText>
      ) : (
        friendGuesses.map(({ friend, guess, at }) => {
          const points = questions.reduce(
            (sum, q) => sum + OUTCOME_POINTS[guessOutcome(guess[q.id], myAnswers[q.id])],
            0,
          );
          return (
            <ThemedView key={friend.id} type="backgroundElement" style={styles.card}>
              <View style={styles.header}>
                <View>
                  <ThemedText type="smallBold">
                    {friend.avatarEmoji} {friend.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    heute, {timeFormatter.format(new Date(at))} Uhr
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">
                  {formatPoints(points)} / {questions.length}
                </ThemedText>
              </View>
              {questions.map((question) => {
                const outcome = guessOutcome(guess[question.id], myAnswers[question.id]);
                return (
                  <View key={question.id} style={styles.row}>
                    <ThemedText style={styles.rowIcon}>{OUTCOME_ICONS[outcome]}</ThemedText>
                    <View style={styles.rowText}>
                      <ThemedText type="small">{question.text}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {friend.name}: {guess[question.id] ? ANSWER_LABELS[guess[question.id]] : '–'} · Du:{' '}
                        {ANSWER_LABELS[myAnswers[question.id]]}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </ThemedView>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  rowIcon: {
    fontSize: 16,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
