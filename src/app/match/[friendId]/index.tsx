import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CategoryMatchResult, matchByCategory, matchWithFriend, useAppStore } from '@/state/appStore';

function CategoryRow({ friendId, result }: { friendId: string; result: CategoryMatchResult }) {
  const subtitle =
    result.percent === null ? 'Noch keine gemeinsamen Antworten' : `${result.matches} von ${result.total} Antworten gleich`;

  return (
    <ListRow
      icon={result.category.icon}
      title={result.category.name}
      subtitle={subtitle}
      trailing={
        <ThemedText type="subtitle" style={styles.percent}>
          {result.percent === null ? '–' : `${result.percent}%`}
        </ThemedText>
      }
      onPress={() =>
        router.push({
          pathname: '/match/[friendId]/[categoryId]',
          params: { friendId, categoryId: result.category.id },
        })
      }
    />
  );
}

export default function MatchCategoriesScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const friend = useAppStore((state) => state.users[friendId ?? '']);
  const overall = useAppStore(useShallow((state) => matchWithFriend(state, friendId ?? '')));
  // `matchByCategory` returns a fresh array of fresh objects every call, so a
  // plain (or shallow) selector is never reference-stable and infinite-loops
  // useSyncExternalStore - recompute only when the underlying data changes.
  const history = useAppStore((state) => state.history);
  const groups = useAppStore((state) => state.groups);
  const categories = useMemo(
    () => matchByCategory(useAppStore.getState(), friendId ?? ''),
    [history, groups, friendId],
  );

  const ranked = [...categories].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

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
        <FlatList
          style={styles.list}
          data={ranked}
          keyExtractor={(item) => item.category.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListHeaderComponent={
            <>
              <ThemedText type="subtitle" style={styles.heading}>
                {friend.avatarEmoji} {friend.name}
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText type="title" style={styles.centerText}>
                  {overall.percent === null ? '–' : `${overall.percent}%`}
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
                  {overall.total > 0
                    ? `${overall.matches} von ${overall.total} vergleichbaren Antworten gleich`
                    : 'Noch keine gemeinsamen Antworten - beantwortet erst ein paar der gleichen Themen.'}
                </ThemedText>
              </ThemedView>

              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                Kategorien
              </ThemedText>
            </>
          }
          renderItem={({ item }) => <CategoryRow friendId={friendId ?? ''} result={item} />}
        />
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
  list: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  heading: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  scoreCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  separator: {
    height: Spacing.one,
  },
  percent: {
    fontSize: 20,
  },
});
