import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResultView } from '@/components/result-view';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { AnswerMap } from '@/types';

export default function FriendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const friend = useAppStore((state) => state.friends.find((f) => f.id === id));
  const deck = useAppStore((state) => state.decksBySubject[id ?? '']);
  const truth = useAppStore((state) => state.selfAnswers[id ?? '']);
  const existingGuess = useAppStore((state) => state.myGuesses[id ?? '']);
  const submitGuess = useAppStore((state) => state.submitGuess);
  const [localGuess, setLocalGuess] = useState<AnswerMap | undefined>(undefined);

  if (!friend || !deck) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Diesen Freund gibt es nicht (mehr).</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  function handleComplete(answers: AnswerMap) {
    submitGuess(friend!.id, answers);
    setLocalGuess(answers);
  }

  const guess = localGuess ?? existingGuess;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          {friend.avatarEmoji} {friend.name}
        </ThemedText>

        {!guess ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Wie würde {friend.name} diese 5 Fragen wohl beantworten?
            </ThemedText>
            <SwipeDeck questions={deck.questions} onComplete={handleComplete} />
          </>
        ) : (
          <>
            <ResultView subjectName={friend.name} questions={deck.questions} guesses={guess} truth={truth} />
            <Pressable
              onPress={() => router.back()}
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">Zurück zur Übersicht</ThemedText>
            </Pressable>
          </>
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
  },
  subheading: {
    marginBottom: Spacing.three,
  },
  button: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    alignSelf: 'center',
  },
});
