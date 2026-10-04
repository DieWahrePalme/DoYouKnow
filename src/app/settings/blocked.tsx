import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { GroupedCard } from '@/components/grouped-card';
import { Screen } from '@/components/screen';
import { SmallButton } from '@/components/small-button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useFriendsStore } from '@/state/friendsStore';
import { UserProfile } from '@/types';

function BlockedRow({ user }: { user: UserProfile }) {
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
    <View style={styles.row}>
      <Avatar emoji={user.avatarEmoji} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {user.name}
        </ThemedText>
        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}
      </View>
      <SmallButton label="Entsperren" onPress={handleUnblock} loading={busy} />
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
    <Screen
      title="Blockierte Personen"
      subtitle="Nach dem Entsperren seid ihr nicht automatisch wieder Freunde – ihr könnt euch aber wieder Anfragen schicken.">
      {blockedUsers.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title="Niemand blockiert" body="Du hast niemanden blockiert." />
      ) : (
        <GroupedCard>
          {blockedUsers.map((user) => (
            <BlockedRow key={user.id} user={user} />
          ))}
        </GroupedCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12, paddingHorizontal: Spacing.three },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bodySemi, fontSize: 16, lineHeight: 22 },
});
