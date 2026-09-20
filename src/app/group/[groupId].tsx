import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HistoryTrail } from '@/components/history-trail';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { latestAnswers, useAppStore } from '@/state/appStore';
import { AnswerMap } from '@/types';

export default function MyGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const theme = useTheme();
  const activeUserId = useAppStore((state) => state.activeUserId);
  const group = useAppStore((state) => state.groups.find((g) => g.id === groupId));
  const historyForGroup = useAppStore((state) => state.history[state.activeUserId]?.[groupId ?? '']);
  const submitSelfAnswers = useAppStore((state) => state.submitSelfAnswers);
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
        <ThemedText type="subtitle" style={styles.heading}>
          {group.icon} {group.name}
        </ThemedText>

        {showSwipeDeck ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
              Beantworte ehrlich – das ist deine aktuelle Wahrheit für dieses Thema.
            </ThemedText>
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
  },
  subheading: {
    marginBottom: Spacing.three,
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
