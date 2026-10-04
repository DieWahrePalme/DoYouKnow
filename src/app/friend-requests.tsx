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
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { IncomingRequest, useFriendsStore } from '@/state/friendsStore';

function RequestRow({ request }: { request: IncomingRequest }) {
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
    <View style={styles.row}>
      <View style={styles.person}>
        <Avatar emoji={request.from.avatarEmoji} />
        <View style={styles.personText}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {request.from.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            möchte dein Freund sein
          </ThemedText>
        </View>
        <IconButton
          icon="ellipsis-horizontal"
          label={`${request.from.name} melden oder blockieren`}
          disabled={busy}
          onPress={() =>
            router.push({
              pathname: '/friend/[id]/safety',
              params: { id: request.from.id, name: request.from.name, avatar: request.from.avatarEmoji },
            })
          }
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <SmallButton label="Ablehnen" variant="danger" onPress={handleDecline} disabled={busy} />
        </View>
        <View style={styles.actionHalf}>
          <SmallButton label="Annehmen" icon="checkmark" variant="primary" onPress={handleAccept} disabled={busy} />
        </View>
      </View>
    </View>
  );
}

export default function FriendRequestsScreen() {
  const incomingRequests = useFriendsStore((state) => state.incomingRequests);
  const loading = useFriendsStore((state) => state.loading);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          style={styles.list}
          data={incomingRequests}
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <AuthHeading
                title="Anfragen"
                subtitle={
                  incomingRequests.length === 0
                    ? undefined
                    : incomingRequests.length === 1
                      ? '1 offene Freundschaftsanfrage'
                      : `${incomingRequests.length} offene Freundschaftsanfragen`
                }
              />
            </View>
          }
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                icon="mail-open-outline"
                title="Keine offenen Anfragen"
                body="Wenn dich jemand als Freund hinzufügt, siehst du es hier."
              />
            )
          }
          renderItem={({ item, index }) => (
            <GroupedListItem index={index} count={incomingRequests.length}>
              <RequestRow request={item} />
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
  listContent: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five },
  header: { marginBottom: Spacing.three },
  row: { padding: Spacing.three, gap: Spacing.three },
  person: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  personText: { flex: 1, gap: 1 },
  name: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  actionHalf: { flex: 1 },
});
