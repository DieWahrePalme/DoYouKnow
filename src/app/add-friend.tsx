import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';

function ResultRow({ user }: { user: UserProfile }) {
  const theme = useTheme();
  const outgoingPendingIds = useFriendsStore((state) => state.outgoingPendingIds);
  const sendRequest = useFriendsStore((state) => state.sendRequest);
  const [sending, setSending] = useState(false);
  const alreadySent = outgoingPendingIds.includes(user.id);

  async function handleSend() {
    setSending(true);
    await sendRequest(user.id);
    setSending(false);
  }

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.rowEmoji}>{user.avatarEmoji}</ThemedText>
      <ThemedText type="default" style={styles.rowName}>
        {user.name}
      </ThemedText>
      <Pressable
        onPress={handleSend}
        disabled={sending || alreadySent}
        style={[styles.sendButton, { backgroundColor: alreadySent ? theme.backgroundSelected : theme.primary }]}>
        <ThemedText type="smallBold" style={{ color: alreadySent ? theme.textSecondary : '#FFFFFF' }}>
          {alreadySent ? 'Angefragt' : sending ? '…' : 'Hinzufügen'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function AddFriendScreen() {
  const [query, setQuery] = useState('');
  const searchResults = useFriendsStore((state) => state.searchResults);
  const searchLoading = useFriendsStore((state) => state.searchLoading);
  const searchUsers = useFriendsStore((state) => state.searchUsers);
  const error = useFriendsStore((state) => state.error);

  function handleChange(value: string) {
    setQuery(value);
    searchUsers(value);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Freunde hinzufügen
        </ThemedText>
        <TextField
          label="Benutzername suchen"
          value={query}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoFocus
          placeholder="z.B. momo_23"
        />
        {error ? (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        ) : null}
        <FlatList
          style={styles.list}
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <ResultRow user={item} />}
          ListEmptyComponent={
            !searchLoading && query.trim().length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                Niemand mit diesem Benutzernamen gefunden.
              </ThemedText>
            ) : null
          }
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  heading: {
    alignSelf: 'flex-start',
  },
  list: {
    width: '100%',
  },
  listContent: {
    gap: Spacing.one,
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
  rowEmoji: {
    fontSize: 26,
  },
  rowName: {
    flex: 1,
  },
  sendButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
