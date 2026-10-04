import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { GroupedCard } from '@/components/grouped-card';
import { ListRow } from '@/components/list-row';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const profile = useAppStore((state) => state.users[state.activeUserId]);
  const email = useAuthStore((state) => state.session?.user.email);
  const signOut = useAuthStore((state) => state.signOut);
  const version = Constants.expoConfig?.version;

  return (
    <Screen title="Einstellungen">
      <View style={[styles.profile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Avatar emoji={profile?.avatarEmoji ?? '🙂'} size={64} />
        <View style={styles.profileText}>
          <ThemedText style={styles.profileName} numberOfLines={1}>
            {profile?.name}
          </ThemedText>
          {email ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {email}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View>
        <SectionLabel>Account</SectionLabel>
        <GroupedCard>
          <ListRow iconName="happy-outline" title="Profilbild ändern" onPress={() => router.push('/settings/avatar')} />
          <ListRow
            iconName="at"
            title="Benutzername ändern"
            subtitle={profile?.name}
            onPress={() => router.push('/settings/username')}
          />
          <ListRow iconName="lock-closed-outline" title="Passwort ändern" onPress={() => router.push('/settings/password')} />
        </GroupedCard>
      </View>

      <View>
        <SectionLabel>Datenschutz</SectionLabel>
        <GroupedCard>
          <ListRow
            iconName="shield-checkmark-outline"
            title="Datenschutz & Konto"
            subtitle="Datenschutz, Blockierte, Konto löschen"
            onPress={() => router.push('/settings/privacy')}
          />
        </GroupedCard>
      </View>

      <Pressable
        onPress={() => signOut()}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.signOut,
          { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : 'rgba(20,20,26,0.6)' },
        ]}>
        <Ionicons name="log-out-outline" size={20} color={theme.danger} />
        <ThemedText style={[styles.signOutLabel, { color: theme.danger }]}>Abmelden</ThemedText>
      </Pressable>

      {version ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
          DoYouKnow · Version {version}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  profileText: { flex: 1, gap: 2 },
  profileName: { fontFamily: FontFamily.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.6, color: '#F5F5F7' },
  signOut: {
    marginTop: Spacing.three,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  signOutLabel: { fontFamily: FontFamily.bodyBold, fontSize: 16, lineHeight: 22 },
  version: { textAlign: 'center', fontSize: 12 },
});
