import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendRow } from '@/components/friend-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { hasHourglass, useAppStore } from '@/state/appStore';
import { Friend, ME_ID } from '@/types';

function FriendListItem({ friend }: { friend: Friend }) {
  const pending = useAppStore((state) => hasHourglass(state, friend.id));

  return (
    <FriendRow
      avatarEmoji={friend.avatarEmoji}
      name={friend.name}
      streak={friend.streak}
      pending={pending}
      onPress={() => router.push({ pathname: '/friend/[id]', params: { id: friend.id } })}
    />
  );
}

export default function HomeScreen() {
  const friends = useAppStore((state) => state.friends);
  const meAnswered = useAppStore((state) => Boolean(state.selfAnswers[ME_ID]));
  const waitingFriendsCount = useAppStore(
    (state) =>
      state.friends.filter((friend) => Boolean(state.guessesAboutMe[friend.id]) && !state.selfAnswers[ME_ID])
        .length,
  );

  const meSubtitle = meAnswered
    ? 'Heute schon beantwortet'
    : waitingFriendsCount > 0
      ? `${waitingFriendsCount} Freund${waitingFriendsCount === 1 ? '' : 'e'} warten auf dich`
      : 'Noch nicht beantwortet';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          style={styles.list}
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.heading}>
                Do You Know?
              </ThemedText>

              <FriendRow
                avatarEmoji="🙂"
                name="Du"
                streak={0}
                hideStreak
                pending={!meAnswered}
                subtitle={meSubtitle}
                onPress={() => router.push('/me')}
              />

              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                Freunde
              </ThemedText>
            </>
          }
          renderItem={({ item }) => <FriendListItem friend={item} />}
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
    marginVertical: Spacing.four,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  separator: {
    height: Spacing.one,
  },
});
