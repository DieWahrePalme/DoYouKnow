import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { matchWithFriend, useAppStore } from '@/state/appStore';
import { UserProfile } from '@/types';

function MatchRow({ friend }: { friend: UserProfile }) {
  const result = useAppStore(useShallow((state) => matchWithFriend(state, friend.id)));

  const subtitle =
    result.percent === null
      ? 'Noch keine gemeinsamen Antworten'
      : `${result.matches} von ${result.total} Antworten gleich`;

  return (
    <ListRow
      icon={friend.avatarEmoji}
      title={friend.name}
      subtitle={subtitle}
      trailing={
        <ThemedText type="subtitle" style={styles.percent}>
          {result.percent === null ? '–' : `${result.percent}%`}
        </ThemedText>
      }
      onPress={() => router.push({ pathname: '/match/[friendId]', params: { friendId: friend.id } })}
    />
  );
}

export default function MatchScreen() {
  const users = useAppStore((state) => state.users);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const friends = Object.values(users).filter((user) => user.id !== activeUserId);
  const ranked = useAppStore(
    useShallow((state) =>
      [...friends].sort((a, b) => {
        const pa = matchWithFriend(state, a.id).percent ?? -1;
        const pb = matchWithFriend(state, b.id).percent ?? -1;
        return pb - pa;
      }),
    ),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          style={styles.list}
          data={friends.length ? ranked : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.heading}>
                Match
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
                Wie ähnlich eure Antworten wirklich sind - über alle Themen hinweg.
              </ThemedText>
            </>
          }
          renderItem={({ item }) => <MatchRow friend={item} />}
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
    fontSize: 32,
    lineHeight: 40,
    marginTop: Spacing.four,
  },
  subheading: {
    marginBottom: Spacing.three,
  },
  separator: {
    height: Spacing.one,
  },
  percent: {
    fontSize: 20,
  },
});
