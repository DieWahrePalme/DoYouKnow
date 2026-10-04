import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuessHeader } from '@/components/guess-header';
import { FriendGuess, FriendGuessesAboutMe } from '@/components/friend-guesses-about-me';
import { HistoryTrail } from '@/components/history-trail';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { latestAnswers, useAppStore } from '@/state/appStore';
import { AnswerMap } from '@/types';
import { guessDayKey } from '@/utils/streak';

export default function MyGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const theme = useTheme();
  const activeUserId = useAppStore((state) => state.activeUserId);
  const group = useAppStore((state) => state.groups.find((g) => g.id === groupId));
  const historyForGroup = useAppStore((state) => state.history[state.activeUserId]?.[groupId ?? '']);
  const submitSelfAnswers = useAppStore((state) => state.submitSelfAnswers);
  const users = useAppStore((state) => state.users);
  const myAvatar = users[activeUserId]?.avatarEmoji ?? '🙂';
  const guesses = useAppStore((state) => state.guesses);
  const guessDays = useAppStore((state) => state.guessDays);
  const today = useAppStore((state) => state.today);
  // Only friends who guessed this card of mine *today* - a guess from an
  // earlier time this card came around stays hidden.
  const friendGuesses: FriendGuess[] = Object.values(users)
    .filter((user) => user.id !== activeUserId)
    .flatMap((friend) => {
      const guessedToday = guessDays[guessDayKey(friend.id, activeUserId, today)];
      const guess = guesses[friend.id]?.[activeUserId]?.[groupId ?? ''];
      if (!guessedToday || guessedToday.groupId !== groupId || !guess) return [];
      return [{ friend, guess, at: guessedToday.at }];
    })
    .sort((a, b) => a.at.localeCompare(b.at));
  const [isUpdating, setIsUpdating] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  if (!group) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Dieses Thema gibt es nicht (mehr).</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const currentAnswers = latestAnswers(historyForGroup);
  const showSwipeDeck = !currentAnswers || isUpdating;

  function handleComplete(answers: AnswerMap) {
    submitSelfAnswers(activeUserId, group!.id, answers);
    setIsUpdating(false);
    setJustSubmitted(true);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heading}>
          <GuessHeader avatarEmoji={myAvatar} kicker="Deine Antworten" topicName={group.name} />
        </View>

        {showSwipeDeck ? (
          <>
            <SwipeDeck questions={group.questions} onComplete={handleComplete} />
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.summary}>
            {justSubmitted ? (
              <ThemedView type="backgroundElement" style={styles.doneBanner}>
                <ThemedText type="smallBold">
                  ✅ Gespeichert – deine Freunde sehen jetzt die aktuelle Antwort.
                </ThemedText>
              </ThemedView>
            ) : null}
            {group.questions.map((question) => (
              <HistoryTrail
                key={question.id}
                questionText={question.text}
                entries={historyForGroup![question.id]}
              />
            ))}
            <FriendGuessesAboutMe
              questions={group.questions}
              myAnswers={currentAnswers!}
              friendGuesses={friendGuesses}
            />
            <Pressable
              onPress={() => {
                setJustSubmitted(false);
                setIsUpdating(true);
              }}
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">Antworten aktualisieren</ThemedText>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  heading: {
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  summary: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  doneBanner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  button: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    alignSelf: 'center',
  },
});
