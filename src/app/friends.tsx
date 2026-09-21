import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StreakBadge } from '@/components/streak-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { useTheme } from '@/hooks/use-theme';
import { getTodaysGroupIdFor, streakWith, useAppStore } from '@/state/appStore';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';

function FriendListRow({ friend }: { friend: UserProfile }) {
  const theme = useTheme();
  const streak = useAppStore((state) => streakWith(state, friend.id));
  const groups = useAppStore((state) => state.groups);
  const now = useEffectiveNow();
  const removeFriend = useFriendsStore((state) => state.removeFriend);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await removeFriend(friend.id);
  }

  function handlePlay() {
    if (!now) return;
    const todaysGroupId = getTodaysGroupIdFor(friend.id, groups, now);
    router.push({ pathname: '/friend/[id]/group/[groupId]', params: { id: friend.id, groupId: todaysGroupId } });
  }

  if (removing) return null;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={styles.avatarEmoji}>{friend.avatarEmoji}</ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText type="default" style={styles.name}>
          {friend.name}
        </ThemedText>
        <StreakBadge streak={streak} />
      </View>
      {streak === 0 ? (
        <Pressable onPress={handlePlay} style={[styles.playButton, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={styles.playButtonText}>
            Spielen
          </ThemedText>
        </Pressable>
      ) : null}
      <Pressable onPress={handleRemove} style={styles.removeButton}>
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Entfernen
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function FriendsScreen() {
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <ThemedText type="subtitle" style={styles.heading}>
              Freunde
            </ThemedText>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Noch keine Freunde - füg welche über das (+) auf der Home-Seite hinzu.
            </ThemedText>
          }
          renderItem={({ item }) => <FriendListRow friend={item} />}
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
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  separator: {
    height: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  playButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.four,
  },
  playButtonText: {
    color: '#FFFFFF',
  },
  removeButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
