import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { IncomingRequest, useFriendsStore } from '@/state/friendsStore';

function RequestRow({ request }: { request: IncomingRequest }) {
  const theme = useTheme();
  const acceptRequest = useFriendsStore((state) => state.acceptRequest);
  const declineRequest = useFriendsStore((state) => state.declineRequest);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    await acceptRequest(request);
    setBusy(false);
  }

  async function handleDecline() {
    setBusy(true);
    await declineRequest(request.friendshipId);
    setBusy(false);
  }

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.rowEmoji}>{request.from.avatarEmoji}</ThemedText>
      <ThemedText type="default" style={styles.rowName}>
        {request.from.name}
      </ThemedText>
      <Pressable disabled={busy} onPress={handleDecline} style={styles.declineButton}>
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Ablehnen
        </ThemedText>
      </Pressable>
      <Pressable disabled={busy} onPress={handleAccept} style={[styles.acceptButton, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" style={styles.acceptButtonText}>
          Annehmen
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function FriendRequestsScreen() {
  const incomingRequests = useFriendsStore((state) => state.incomingRequests);
  const loading = useFriendsStore((state) => state.loading);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          style={styles.list}
          data={incomingRequests}
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <ThemedText type="subtitle" style={styles.heading}>
              Freundschaftsanfragen
            </ThemedText>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                Keine offenen Anfragen.
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => <RequestRow request={item} />}
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
  rowEmoji: {
    fontSize: 26,
  },
  rowName: {
    flex: 1,
  },
  declineButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  acceptButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  acceptButtonText: {
    color: '#FFFFFF',
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
