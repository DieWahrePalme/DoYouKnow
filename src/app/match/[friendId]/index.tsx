import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { GroupedCard } from '@/components/grouped-card';
import { ListRow } from '@/components/list-row';
import { Screen } from '@/components/screen';
import { ScoreHero } from '@/components/score-hero';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
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
        <ThemedText style={styles.percent}>{result.percent === null ? '–' : `${result.percent}%`}</ThemedText>
      }
      chevron
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
      <Screen>
        <EmptyState icon="person-outline" title="Nicht gefunden" body="Diesen Freund gibt es nicht (mehr)." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.person}>
        <Avatar emoji={friend.avatarEmoji} size={72} />
        <ThemedText style={styles.name}>{friend.name}</ThemedText>
      </View>

      <ScoreHero
        percent={overall.percent}
        caption={
          overall.total > 0
            ? `${overall.matches} von ${overall.total} vergleichbaren Antworten gleich`
            : 'Noch keine gemeinsamen Antworten - beantwortet erst ein paar der gleichen Themen.'
        }
      />

      <View>
        <SectionLabel>Kategorien</SectionLabel>
        <GroupedCard>
          {ranked.map((item) => (
            <CategoryRow key={item.category.id} friendId={friendId ?? ''} result={item} />
          ))}
        </GroupedCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  person: { alignItems: 'center', gap: Spacing.two },
  name: { fontFamily: FontFamily.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
  percent: { fontFamily: FontFamily.display, fontSize: 20, lineHeight: 24 },
});
