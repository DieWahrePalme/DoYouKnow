import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuessHeader } from '@/components/guess-header';
import { FriendGuess, FriendGuessesAboutMe } from '@/components/friend-guesses-about-me';
import { HistoryTrail } from '@/components/history-trail';
import { SectionLabel } from '@/components/section-label';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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

  const header = <GuessHeader avatarEmoji={myAvatar} kicker="Deine Karte" topicName={group.name} />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {showSwipeDeck ? (
          <SwipeDeck questions={group.questions} onComplete={handleComplete} header={header} />
        ) : (
          <ScrollView contentContainerStyle={styles.summary} showsVerticalScrollIndicator={false}>
            <View style={styles.heading}>{header}</View>
            {justSubmitted ? (
              <View style={[styles.doneBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <ThemedText type="smallBold" style={styles.doneText}>
                  Gespeichert – deine Freunde sehen jetzt die aktuelle Antwort.
                </ThemedText>
              </View>
            ) : null}

            <SectionLabel>Deine Antworten</SectionLabel>
            <View style={[styles.answersCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {group.questions.map((question, i) => (
                <View
                  key={question.id}
                  style={i > 0 ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth } : undefined}>
                  <HistoryTrail questionText={question.text} entries={historyForGroup![question.id]} />
                </View>
              ))}
            </View>

            <SectionLabel>Von Freunden getippt</SectionLabel>
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
              accessibilityRole="button"
              style={[styles.button, { borderColor: theme.border }]}>
              <Ionicons name="refresh" size={18} color={theme.text} />
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  heading: {
    marginTop: Spacing.two,
  },
  summary: {
    paddingBottom: Spacing.five,
  },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  doneText: { flex: 1 },
  answersCard: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  button: {
    marginTop: Spacing.four,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
