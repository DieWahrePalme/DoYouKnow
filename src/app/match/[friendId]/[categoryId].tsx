import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { AnswerChip } from '@/components/answer-chip';
import { EmptyState } from '@/components/empty-state';
import { GroupedCard } from '@/components/grouped-card';
import { Screen } from '@/components/screen';
import { ScoreHero } from '@/components/score-hero';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/data/mockData';
import { useTheme } from '@/hooks/use-theme';
import { matchByCategory, sharedAnswers, useAppStore } from '@/state/appStore';

export default function MatchCategoryDetailScreen() {
  const { friendId, categoryId } = useLocalSearchParams<{ friendId: string; categoryId: string }>();
  const theme = useTheme();

  const friend = useAppStore((state) => state.users[friendId ?? '']);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const result = useAppStore(
    useShallow((state) => matchByCategory(state, friendId ?? '').find((r) => r.category.id === categoryId)),
  );
  // `sharedAnswers` returns freshly-built objects, so a plain selector would
  // never be reference-stable (infinite update loop) - recompute only when
  // the underlying history actually changes.
  const history = useAppStore((state) => state.history);
  const groups = useAppStore((state) => state.groups);
  const shared = useMemo(
    () => sharedAnswers(useAppStore.getState(), friendId ?? '', categoryId),
    [history, groups, friendId, categoryId],
  );
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  if (!friend || !category || !result) {
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title="Nicht gefunden" body="Das gibt es nicht (mehr)." />
      </Screen>
    );
  }

  return (
    <Screen title={category.name} subtitle={`Match mit ${friend.name}`}>
      <ScoreHero
        percent={result.percent}
        caption={
          result.total > 0
            ? `${result.matches} von ${result.total} vergleichbaren Antworten gleich`
            : 'Noch keine gemeinsamen Antworten in dieser Kategorie.'
        }
      />

      <View>
        <SectionLabel>Ihr seid euch einig</SectionLabel>
        {shared.length > 0 ? (
          <GroupedCard>
            {shared.map((item) => {
              const favoriteId = `${activeUserId}:${friend.id}:${item.group.id}:${item.questionId}`;
              const isFavorite = favorites.some((f) => f.id === favoriteId);
              const question = item.group.questions.find((q) => q.id === item.questionId)!;
              return (
                <View key={favoriteId} style={styles.row}>
                  <View style={styles.rowText}>
                    <ThemedText style={styles.question}>{question.text}</ThemedText>
                    <View style={styles.chipLine}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Beide:
                      </ThemedText>
                      <AnswerChip value={item.value} />
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleFavorite(friend.id, item.group.id, item.questionId)}
                    accessibilityRole="button"
                    accessibilityLabel={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    accessibilityState={{ selected: isFavorite }}
                    hitSlop={10}>
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={26}
                      color={isFavorite ? theme.danger : theme.textSecondary}
                    />
                  </Pressable>
                </View>
              );
            })}
          </GroupedCard>
        ) : (
          <EmptyState
            icon="git-compare-outline"
            title="Noch nichts gemeinsam"
            body="Sobald ihr bei einer Frage dieselbe Antwort gebt, taucht sie hier auf."
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  rowText: { flex: 1, gap: Spacing.two },
  question: { fontFamily: FontFamily.bodySemi, fontSize: 15, lineHeight: 21 },
  chipLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
