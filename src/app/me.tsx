import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { AnswerMap, ME_ID } from '@/types';

export default function MeScreen() {
  const theme = useTheme();
  const deck = useAppStore((state) => state.decksBySubject[ME_ID]);
  const submitSelfAnswers = useAppStore((state) => state.submitSelfAnswers);
  const alreadyAnswered = useAppStore((state) => Boolean(state.selfAnswers[ME_ID]));
  const [justSubmitted, setJustSubmitted] = useState(false);

  function handleComplete(answers: AnswerMap) {
    submitSelfAnswers(ME_ID, answers);
    setJustSubmitted(true);
  }

  const done = alreadyAnswered || justSubmitted;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {done ? (
          <ThemedView type="backgroundElement" style={styles.doneCard}>
            <ThemedText style={styles.doneEmoji}>✅</ThemedText>
            <ThemedText type="subtitle" style={styles.centerText}>
              Danke!
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
              Deine Antworten sind gespeichert. Freunde, die schon über dich geraten haben, sehen jetzt sofort
              ihre Auflösung.
            </ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">Zurück zur Übersicht</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.heading}>
              Deine Fragen heute
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Beantworte ehrlich – deine Freunde raten, wie gut sie dich kennen.
            </ThemedText>
            <SwipeDeck questions={deck.questions} onComplete={handleComplete} />
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
  doneCard: {
    marginTop: Spacing.six,
    borderRadius: Spacing.four,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  doneEmoji: {
    fontSize: 40,
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
});
