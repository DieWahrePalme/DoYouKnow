import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHeading } from '@/components/auth-heading';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { GroupedListItem } from '@/components/grouped-list-item';
import { SmallButton } from '@/components/small-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLACEHOLDER_COLOR, FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';

function ResultRow({ user }: { user: UserProfile }) {
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
    <View style={styles.row}>
      <Avatar emoji={user.avatarEmoji} />
      <ThemedText style={styles.rowName} numberOfLines={1}>
        {user.name}
      </ThemedText>
      {alreadySent ? (
        <SmallButton label="Angefragt" icon="checkmark" onPress={() => {}} disabled />
      ) : (
        <SmallButton label="Hinzufügen" icon="person-add-outline" variant="primary" onPress={handleSend} loading={sending} />
      )}
    </View>
  );
}

export default function AddFriendScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const searchResults = useFriendsStore((state) => state.searchResults);
  const searchLoading = useFriendsStore((state) => state.searchLoading);
  const searchUsers = useFriendsStore((state) => state.searchUsers);
  const error = useFriendsStore((state) => state.error);

  function handleChange(value: string) {
    setQuery(value);
    searchUsers(value);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          style={styles.list}
          data={hasQuery ? searchResults : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <AuthHeading title="Freunde hinzufügen" subtitle="Such nach dem Benutzernamen deiner Freunde." />
              <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={handleChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  placeholder="z. B. momo_23"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  selectionColor={theme.primary}
                  maxFontSizeMultiplier={2}
                  accessibilityLabel="Benutzername suchen"
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {searchLoading ? (
                  <ActivityIndicator size="small" color={theme.textSecondary} />
                ) : hasQuery ? (
                  <Pressable onPress={() => handleChange('')} accessibilityRole="button" accessibilityLabel="Suche leeren" hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
              {error ? (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <GroupedListItem index={index} count={searchResults.length}>
              <ResultRow user={item} />
            </GroupedListItem>
          )}
          ListEmptyComponent={
            hasQuery ? (
              searchLoading ? null : (
                <EmptyState
                  icon="search-outline"
                  title="Niemand gefunden"
                  body="Prüf die Schreibweise – Benutzernamen bestehen nur aus a–z, Zahlen und _."
                />
              )
            ) : (
              <EmptyState
                icon="person-add-outline"
                title="Wer fehlt noch?"
                body="Gib den Benutzernamen ein. Sobald deine Freundin oder dein Freund die Anfrage annimmt, könnt ihr loslegen."
              />
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  list: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  listContent: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 16,
    height: '100%',
    outlineStyle: 'none',
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  rowName: { flex: 1, fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
});
