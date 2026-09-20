import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendRow } from '@/components/friend-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hasHourglassForFriend, useAppStore, waitingForMeCount } from '@/state/appStore';
import { Friend } from '@/types';

function FriendListItem({ friend }: { friend: Friend }) {
  const pending = useAppStore((state) => hasHourglassForFriend(state, friend.id));

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
  const theme = useTheme();
  const profile = useAppStore((state) => state.profile);
  const friends = useAppStore((state) => state.friends);
  const waitingCount = useAppStore((state) => waitingForMeCount(state));

  const meSubtitle =
    waitingCount > 0
      ? `${waitingCount} Antwort${waitingCount === 1 ? '' : 'en'} steh${waitingCount === 1 ? 't' : 'en'} aus`
      : 'Alles aktuell';

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
              <View style={styles.headerRow}>
                <Pressable
                  onPress={() => router.push('/profile')}
                  style={[styles.profileButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={styles.profileEmoji}>{profile.avatarEmoji}</ThemedText>
                </Pressable>
                <ThemedText type="title" style={styles.heading}>
                  Do You Know?
                </ThemedText>
              </View>

              <FriendRow
                avatarEmoji={profile.avatarEmoji}
                name={profile.name}
                streak={0}
                hideStreak
                pending={waitingCount > 0}
                subtitle={meSubtitle}
                onPress={() => router.push('/profile')}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 20,
  },
  heading: {
    fontSize: 32,
    lineHeight: 40,
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
