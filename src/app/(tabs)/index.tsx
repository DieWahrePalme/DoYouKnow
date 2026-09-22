import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountdownTimer } from '@/components/countdown-timer';
import { FriendRow } from '@/components/friend-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, ThemeColor } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { useTheme } from '@/hooks/use-theme';
import {
  getTodaysGroupIdFor,
  latestAnswers,
  msUntilNextDay,
  myGuessStatus,
  streakWith,
  useAppStore,
} from '@/state/appStore';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';
import { pairKey } from '@/utils/pairKey';

/** Within this window before the daily deadline, "not answered yet" escalates from a neutral x to an urgent warning. */
const URGENCY_WINDOW_MS = 2 * 60 * 60 * 1000;

/** How often Home quietly re-syncs with Supabase while it's the visible screen, so a friend answering shows up without a manual reload. */
const AUTO_REFRESH_INTERVAL_MS = 20 * 1000;

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
  const streak = useAppStore((state) => streakWith(state, friend.id));
  const groups = useAppStore((state) => state.groups);
  const now = useEffectiveNow();
  const todaysGroupId = now ? getTodaysGroupIdFor(friend.id, groups, now) : groups[0].id;
  const todaysGroup = groups.find((g) => g.id === todaysGroupId)!;
  const status = useAppStore((state) => myGuessStatus(state, friend.id, todaysGroupId));

  let statusIcon: string;
  let statusTone: ThemeColor;
  if (status === 'resolved') {
    statusIcon = '✅';
    statusTone = 'success';
  } else if (status === 'waiting_for_truth') {
    statusIcon = '⏳';
    statusTone = 'primary';
  } else if (now && msUntilNextDay(now) <= URGENCY_WINDOW_MS) {
    statusIcon = '❗';
    statusTone = 'danger';
  } else {
    statusIcon = '❌';
    statusTone = 'textSecondary';
  }

  return (
    <FriendRow
      avatarEmoji={friend.avatarEmoji}
      name={friend.name}
      streak={streak}
      statusIcon={now ? statusIcon : undefined}
      statusTone={statusTone}
      subtitle={now ? `Heute: ${todaysGroup.icon} ${todaysGroup.name}` : 'Lädt …'}
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

function ChallengeCard() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/friends')}
      style={[styles.challengeCard, { borderColor: theme.border }]}>
      <View style={[styles.challengeIconWrap, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.challengeIcon}>＋</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Freund herausfordern
      </ThemedText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const users = useAppStore((state) => state.users);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const streaks = useAppStore((state) => state.streaks);
  const streakOf = (friendId: string) => streaks[pairKey(activeUserId, friendId)] ?? 0;
  // Every accepted friend shows up right away - streak only decides the order, not visibility.
  const friends = Object.values(users)
    .filter((user) => user.id !== activeUserId)
    .sort((a, b) => streakOf(b.id) - streakOf(a.id) || a.name.localeCompare(b.name));

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    await useFriendsStore.getState().fetchAll();
  }, []);

  const onPullToRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Re-syncs whenever Home becomes the visible screen (e.g. coming back from
  // answering/guessing), then keeps quietly polling while it stays visible -
  // so a friend answering their questions shows up without a manual reload.
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const interval = setInterval(() => void refresh(), AUTO_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [refresh]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          style={styles.list}
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          refreshing={refreshing}
          onRefresh={onPullToRefresh}
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
          ListFooterComponent={<ChallengeCard />}
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
  challengeCard: {
    marginTop: Spacing.one,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  challengeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIcon: {
    fontSize: 20,
  },
});
