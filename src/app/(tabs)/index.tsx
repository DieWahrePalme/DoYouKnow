import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountdownTimer } from '@/components/countdown-timer';
import { FriendRow } from '@/components/friend-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import {
  getTodaysGroupIdFor,
  hasHourglassForFriend,
  latestAnswers,
  myGuessStatus,
  streakWith,
  useAppStore,
} from '@/state/appStore';
import { useFriendsStore } from '@/state/friendsStore';
import { useTheme } from '@/hooks/use-theme';
import { UserProfile } from '@/types';

function TopBar() {
  const theme = useTheme();
  const requestCount = useFriendsStore((state) => state.incomingRequests.length);

  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={() => router.push('/add-friend')}
        hitSlop={12}
        style={[styles.topBarButton, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.topBarIcon}>＋</ThemedText>
      </Pressable>
      <View style={styles.topBarSpacer} />
      <Pressable
        onPress={() => router.push('/friend-requests')}
        hitSlop={12}
        style={[styles.topBarButton, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.topBarIcon}>📥</ThemedText>
        {requestCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.danger }]}>
            <ThemedText type="small" style={styles.badgeText}>
              {requestCount}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function FriendListItem({ friend }: { friend: UserProfile }) {
  const pending = useAppStore((state) => hasHourglassForFriend(state, friend.id));
  const streak = useAppStore((state) => streakWith(state, friend.id));
  const groups = useAppStore((state) => state.groups);
  const now = useEffectiveNow();
  const todaysGroupId = now ? getTodaysGroupIdFor(friend.id, groups, now) : groups[0].id;
  const todaysGroup = groups.find((g) => g.id === todaysGroupId)!;
  const status = useAppStore((state) => myGuessStatus(state, friend.id, todaysGroupId));

  let statusText: string;
  if (status === 'resolved') {
    statusText = 'aufgelöst';
  } else if (status === 'waiting_for_truth') {
    statusText = `wartet auf ${friend.name}`;
  } else {
    statusText = 'jetzt raten';
  }

  return (
    <FriendRow
      avatarEmoji={friend.avatarEmoji}
      name={friend.name}
      streak={streak}
      pending={pending}
      subtitle={now ? `Heute: ${todaysGroup.icon} ${todaysGroup.name} · ${statusText}` : 'Lädt …'}
      onPress={() =>
        router.push({
          pathname: '/friend/[id]/group/[groupId]',
          params: { id: friend.id, groupId: todaysGroupId },
        })
      }
    />
  );
}

function TodaysCard() {
  const activeUserId = useAppStore((state) => state.activeUserId);
  const profile = useAppStore((state) => state.users[state.activeUserId]);
  const groups = useAppStore((state) => state.groups);
  // Falls back to a fixed group (same on server prerender and first client
  // paint) until mounted, then swaps to the real per-day pick - see
  // useEffectiveNow for why this can't just read Date.now() directly.
  const now = useEffectiveNow();
  const todaysGroupId = now ? getTodaysGroupIdFor(activeUserId, groups, now) : groups[0].id;
  const todaysGroup = groups.find((g) => g.id === todaysGroupId)!;
  const answeredToday = useAppStore((state) =>
    Boolean(latestAnswers(state.history[activeUserId]?.[todaysGroupId])),
  );

  return (
    <FriendRow
      avatarEmoji={profile.avatarEmoji}
      name={profile.name}
      streak={0}
      hideStreak
      subtitle={
        now
          ? `Heute: ${todaysGroup.icon} ${todaysGroup.name} · ${answeredToday ? 'schon aktualisiert' : 'jetzt beantworten'}`
          : 'Lädt …'
      }
      onPress={() => router.push({ pathname: '/group/[groupId]', params: { groupId: todaysGroupId } })}
    />
  );
}

export default function HomeScreen() {
  const users = useAppStore((state) => state.users);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const friends = Object.values(users).filter((user) => user.id !== activeUserId);

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
              <TopBar />
              <CountdownTimer />

              <ThemedText type="title" style={styles.heading}>
                Do You Know?
              </ThemedText>

              <TodaysCard />

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  topBarSpacer: {
    flex: 1,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
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
    marginBottom: Spacing.two,
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
