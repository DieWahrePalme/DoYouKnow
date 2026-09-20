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
import { latestAnswers, useAppStore } from '@/state/appStore';
import { AnswerMap } from '@/types';

export default function FriendGroupGuessScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const theme = useTheme();

  const friend = useAppStore((state) => state.friends.find((f) => f.id === id));
  const group = useAppStore((state) => state.groups.find((g) => g.id === groupId));
  const historyForGroup = useAppStore((state) => state.history[id ?? '']?.[groupId ?? '']);
  const existingGuess = useAppStore((state) => state.myGuesses[id ?? '']?.[groupId ?? '']);
  const submitGuess = useAppStore((state) => state.submitGuess);
  const [localGuess, setLocalGuess] = useState<AnswerMap | undefined>(undefined);

  if (!friend || !group) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Das gibt es nicht (mehr).</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const truth = latestAnswers(historyForGroup);

  function handleComplete(answers: AnswerMap) {
    submitGuess(friend!.id, group!.id, answers);
    setLocalGuess(answers);
  }

  const guess = localGuess ?? existingGuess;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          {group.icon} {group.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
          {friend.avatarEmoji} {friend.name}
        </ThemedText>

        {!guess ? (
          <SwipeDeck questions={group.questions} onComplete={handleComplete} />
        ) : (
          <>
            <ResultView subjectName={friend.name} questions={group.questions} guesses={guess} truth={truth} />
            <Pressable
              onPress={() => router.back()}
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">Zurück</ThemedText>
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
