import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';

function BlockedRow({ user }: { user: UserProfile }) {
  const theme = useTheme();
  const unblockUser = useFriendsStore((state) => state.unblockUser);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnblock() {
    setBusy(true);
    const { error: unblockError } = await unblockUser(user.id);
    setBusy(false);
    setError(unblockError);
  }

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.emoji}>{user.avatarEmoji}</ThemedText>
      <View style={styles.info}>
        <ThemedText type="default">{user.name}</ThemedText>
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
      </View>
      <Pressable onPress={handleUnblock} disabled={busy} accessibilityRole="button" style={styles.unblock}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {busy ? '…' : 'Entsperren'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function BlockedUsersScreen() {
  const blockedUsers = useFriendsStore((state) => state.blockedUsers);
  const fetchBlocked = useFriendsStore((state) => state.fetchBlocked);

  useEffect(() => {
    void fetchBlocked();
  }, [fetchBlocked]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          style={styles.list}
          data={blockedUsers}
          keyExtractor={(user) => user.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">Blockierte Personen</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Nach dem Entsperren seid ihr keine Freunde mehr automatisch – ihr könnt euch aber wieder Anfragen schicken.
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary">
              Du hast niemanden blockiert.
            </ThemedText>
          }
          renderItem={({ item }) => <BlockedRow user={item} />}
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
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  emoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  info: {
    flex: 1,
  },
  unblock: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
