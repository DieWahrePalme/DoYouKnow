import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHeading } from '@/components/auth-heading';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { GroupedListItem } from '@/components/grouped-list-item';
import { IconButton } from '@/components/icon-button';
import { SmallButton } from '@/components/small-button';
import { StreakBadge } from '@/components/streak-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/primary-button';
import { BottomTabInset, FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
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
    <View style={styles.row}>
      <Avatar emoji={friend.avatarEmoji} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {friend.name}
        </ThemedText>
        <StreakBadge streak={streak} />
      </View>
      {streak === 0 ? <SmallButton label="Spielen" variant="primary" onPress={handlePlay} /> : null}
      <IconButton icon="person-remove-outline" label={`${friend.name} entfernen`} color={theme.danger} onPress={handleRemove} />
      <IconButton
        icon="ellipsis-horizontal"
        label={`${friend.name} melden oder blockieren`}
        onPress={() =>
          router.push({
            pathname: '/friend/[id]/safety',
            params: { id: friend.id, name: friend.name, avatar: friend.avatarEmoji },
          })
        }
      />
    </View>
  );
}

export default function FriendsScreen() {
  const users = useAppStore((state) => state.users);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const friends = Object.values(users).filter((user) => user.id !== activeUserId);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          style={styles.list}
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <AuthHeading
                title="Freunde"
                subtitle={friends.length === 1 ? '1 Freund' : `${friends.length} Freunde`}
              />
              <PrimaryButton label="Freund hinzufügen" onPress={() => router.push('/add-friend')} />
              <View style={styles.headerGap} />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Noch keine Freunde"
              body="Such nach dem Benutzernamen deiner Freunde und schick ihnen eine Anfrage."
            />
          }
          renderItem={({ item, index }) => (
            <GroupedListItem index={index} count={friends.length}>
              <FriendListRow friend={item} />
            </GroupedListItem>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  list: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  listContent: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: BottomTabInset },
  header: { gap: Spacing.three },
  headerGap: { height: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
});
