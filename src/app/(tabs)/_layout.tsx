import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FloatingTabBar, TabItem } from '@/components/floating-tab-bar';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';
import { useFriendsStore } from '@/state/friendsStore';

/** Route name (file in this folder) -> tab bar entry. Order here is the order in the bar. */
const TABS: TabItem[] = [
  { key: 'index', icon: 'flame', label: 'Heute' },
  { key: 'match', icon: 'git-compare', label: 'Match' },
  { key: 'favorites', icon: 'star', label: 'Favoriten' },
  { key: 'profile', icon: 'person', label: 'Profil' },
];

export default function TabsLayout() {
  const theme = Colors.dark;
  const authProfile = useAuthStore((state) => state.profile);
  const profileError = useAuthStore((state) => state.profileError);
  const retryProfileLoad = useAuthStore((state) => state.retryProfileLoad);
  const signOut = useAuthStore((state) => state.signOut);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const syncRealUser = useAppStore((state) => state.syncRealUser);

  useEffect(() => {
    if (authProfile) {
      syncRealUser({ id: authProfile.id, name: authProfile.username, avatarEmoji: authProfile.avatarEmoji });
      useFriendsStore.getState().fetchAll();
    }
  }, [authProfile, syncRealUser]);

  if (profileError) {
    return (
      <View style={[styles.container, styles.centered, styles.errorPadding]}>
        <ThemedText style={styles.errorTitle}>Profil nicht gefunden</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {profileError}
        </ThemedText>
        <View style={styles.fullWidth}>
          <PrimaryButton label="Erneut versuchen" onPress={() => retryProfileLoad()} />
        </View>
        <ThemedText type="smallBold" themeColor="danger" onPress={() => signOut()} style={styles.signOut}>
          Abmelden
        </ThemedText>
      </View>
    );
  }

  if (!activeUserId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  // Real tabs: each screen is mounted once (on first visit) and then kept, so
  // switching back is instant instead of rebuilding the screen. Hidden tabs are
  // frozen so they don't re-render in the background.
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={({ state, navigation }) => (
        <FloatingTabBar
          tabs={TABS}
          activeKey={state.routes[state.index]?.name ?? 'index'}
          onSelect={(key) => navigation.navigate(key)}
        />
      )}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.key} name={tab.key} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorPadding: {
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  errorTitle: {
    fontFamily: FontFamily.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: '#F5F5F7',
  },
  centerText: {
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  signOut: {
    paddingVertical: Spacing.two,
  },
});
