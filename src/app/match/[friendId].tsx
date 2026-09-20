import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { matchWithFriend, sharedAnswers, useAppStore } from '@/state/appStore';
import { ANSWER_LABELS } from '@/types';

export default function MatchDetailScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const theme = useTheme();

  const friend = useAppStore((state) => state.friends.find((f) => f.id === friendId));
  const result = useAppStore(useShallow((state) => matchWithFriend(state, friendId ?? '')));
  // `sharedAnswers` returns freshly-built objects, so a plain selector would
  // never be reference-stable (infinite update loop) - recompute only when
  // the underlying history actually changes.
  const history = useAppStore((state) => state.history);
  const groups = useAppStore((state) => state.groups);
  const shared = useMemo(
    () => sharedAnswers(useAppStore.getState(), friendId ?? ''),
    [history, groups, friendId],
  );
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  if (!friend) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Diesen Freund gibt es nicht (mehr).</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.heading}>
            {friend.avatarEmoji} {friend.name}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.scoreCard}>
            <ThemedText type="title" style={styles.centerText}>
              {result.percent === null ? '–' : `${result.percent}%`}
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
              {result.total > 0
                ? `${result.matches} von ${result.total} vergleichbaren Antworten gleich`
                : 'Noch keine gemeinsamen Antworten - beantwortet erst ein paar der gleichen Themen.'}
            </ThemedText>
          </ThemedView>

          {shared.length > 0 ? (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                Ihr seid euch einig
              </ThemedText>
              {shared.map((item) => {
                const favoriteId = `${friend.id}:${item.group.id}:${item.questionId}`;
                const isFavorite = favorites.some((f) => f.id === favoriteId);
                const question = item.group.questions.find((q) => q.id === item.questionId)!;
                return (
                  <View key={favoriteId} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={styles.rowIcon}>{item.group.icon}</ThemedText>
                    <View style={styles.rowText}>
                      <ThemedText type="small">{question.text}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Beide: {ANSWER_LABELS[item.value]}
                      </ThemedText>
                    </View>
                    <Pressable onPress={() => toggleFavorite(friend.id, item.group.id, item.questionId)}>
                      <ThemedText style={styles.heart}>{isFavorite ? '❤️' : '🤍'}</ThemedText>
                    </Pressable>
                  </View>
                );
              })}
            </>
          ) : null}
        </ScrollView>
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
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  heading: {
    marginTop: Spacing.three,
  },
  scoreCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.three,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  heart: {
    fontSize: 22,
  },
});
