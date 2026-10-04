import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { CountdownTimer } from '@/components/countdown-timer';
import { FriendRow, StatusIcon } from '@/components/friend-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FontFamily, MaxContentWidth, Radius, Spacing, ThemeColor } from '@/constants/theme';
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
        accessibilityRole="button"
        accessibilityLabel="Freund hinzufügen"
        style={[styles.addPill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="person-add-outline" size={18} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary" style={styles.addPillText}>
          Freund hinzufügen
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => router.push('/friend-requests')}
        accessibilityRole="button"
        accessibilityLabel={requestCount > 0 ? `Freundschaftsanfragen, ${requestCount} neu` : 'Freundschaftsanfragen'}
        style={[styles.roundButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="mail-outline" size={20} color={theme.text} />
        {requestCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.badgeText}>{requestCount}</ThemedText>
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

  let statusIcon: StatusIcon;
  let statusTone: ThemeColor;
  if (status === 'resolved') {
    statusIcon = 'checkmark';
    statusTone = 'success';
  } else if (status === 'waiting_for_truth') {
    statusIcon = 'hourglass';
    statusTone = 'primary';
  } else if (now && msUntilNextDay(now) <= URGENCY_WINDOW_MS) {
    statusIcon = 'alert';
    statusTone = 'danger';
  } else {
    statusIcon = 'ellipse-outline';
    statusTone = 'textSecondary';
  }

  return (
    <FriendRow
      avatarEmoji={friend.avatarEmoji}
      name={friend.name}
      streak={streak}
      statusIcon={now ? statusIcon : undefined}
      statusTone={statusTone}
      subtitle={now ? `Heute: ${todaysGroup.name}` : 'Lädt …'}
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

  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/group/[groupId]', params: { groupId: todaysGroupId } })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.hero,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.heroTop}>
        <ThemedText type="small" themeColor="textSecondary">
          Deine Karte heute
        </ThemedText>
        <View style={[styles.heroAvatar, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.heroAvatarEmoji}>{profile.avatarEmoji}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.heroTitle} numberOfLines={2}>
        {now ? todaysGroup.name : 'Lädt …'}
      </ThemedText>
      <View style={[styles.heroAction, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" themeColor="primaryText">
          {answeredToday ? 'Antworten ansehen' : 'Jetzt beantworten'}
        </ThemedText>
        <Ionicons name="arrow-forward" size={16} color={theme.primaryText} />
      </View>
    </Pressable>
  );
}

function ChallengeCard() {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/friends')}
      accessibilityRole="button"
      style={[styles.challengePill, { borderColor: theme.border }]}>
      <Ionicons name="people-outline" size={18} color={theme.text} />
      <ThemedText type="smallBold">Freund herausfordern</ThemedText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const users = useAppStore((state) => state.users);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const streakByFriend = useAppStore(
    useShallow((state) =>
      Object.fromEntries(
        Object.keys(state.users)
          .filter((id) => id !== state.activeUserId)
          .map((id) => [id, streakWith(state, id)]),
      ),
    ),
  );
  // Every accepted friend shows up right away - streak only decides the order, not visibility.
  const friends = Object.values(users)
    .filter((user) => user.id !== activeUserId)
    .sort((a, b) => (streakByFriend[b.id] ?? 0) - (streakByFriend[a.id] ?? 0) || a.name.localeCompare(b.name));

  const theme = useTheme();
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
          refreshing={refreshing}
          onRefresh={onPullToRefresh}
          ListHeaderComponent={
            <>
              <TopBar />

              <ThemedText type="title" style={styles.heading}>
                Do You Know?
              </ThemedText>
              <CountdownTimer />

              <TodaysCard />

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Freunde
              </ThemedText>
            </>
          }
          ListFooterComponent={<ChallengeCard />}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.groupRow,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                index === 0 && styles.groupFirst,
                index === friends.length - 1 && styles.groupLast,
              ]}>
              <FriendListItem friend={item} />
            </View>
          )}
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
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  addPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addPillText: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 15,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FontFamily.bodyBold,
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
    paddingBottom: BottomTabInset + Spacing.four,
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  hero: {
    marginTop: Spacing.four,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  heroTitle: {
    fontFamily: FontFamily.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: '#F5F5F7',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 48,
    borderRadius: Radius.pill,
  },
  sectionLabel: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  groupRow: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  groupFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
  },
  groupLast: {
    borderBottomLeftRadius: Radius.card,
    borderBottomRightRadius: Radius.card,
  },
  challengePill: {
    marginTop: Spacing.three,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
