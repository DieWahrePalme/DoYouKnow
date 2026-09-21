import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const profile = useAppStore((state) => state.users[state.activeUserId]);
  const email = useAuthStore((state) => state.session?.user.email);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="title" style={styles.heading}>
            Einstellungen
          </ThemedText>
          {email ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.email}>
              {email}
            </ThemedText>
          ) : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            Account
          </ThemedText>
          <View style={styles.section}>
            <ListRow
              icon={profile?.avatarEmoji ?? '🙂'}
              title="Profilbild ändern"
              onPress={() => router.push('/settings/avatar')}
            />
            <ListRow
              icon="👤"
              title="Benutzername ändern"
              subtitle={profile?.name}
              onPress={() => router.push('/settings/username')}
            />
            <ListRow icon="🔒" title="Passwort ändern" onPress={() => router.push('/settings/password')} />
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            Datenschutz
          </ThemedText>
          <View style={styles.section}>
            <ListRow icon="🛡️" title="Privacy Settings" onPress={() => router.push('/settings/privacy')} />
          </View>

          <Pressable
            onPress={() => signOut()}
            style={[styles.signOutButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Abmelden
            </ThemedText>
          </Pressable>
        </ScrollView>
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
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  heading: {
    fontSize: 32,
    lineHeight: 40,
    marginTop: Spacing.three,
  },
  email: {
    marginTop: -Spacing.one,
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  section: {
    gap: Spacing.one,
  },
  signOutButton: {
    marginTop: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
