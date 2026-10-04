import { Href, Slot, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FloatingTabBar, IconName } from '@/components/floating-tab-bar';
import { Colors, Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';
import { useFriendsStore } from '@/state/friendsStore';

interface TabDef {
  href: Href;
  isActive: (pathname: string) => boolean;
  icon: IconName;
  label: string;
}

const TABS: TabDef[] = [
  { href: '/', isActive: (p) => p === '/', icon: 'flame', label: 'Heute' },
  { href: '/match', isActive: (p) => p === '/match', icon: 'git-compare', label: 'Match' },
  { href: '/favorites', isActive: (p) => p === '/favorites', icon: 'star', label: 'Favoriten' },
  { href: '/profile', isActive: (p) => p === '/profile', icon: 'person', label: 'Profil' },
];

export default function TabsLayout() {
  const theme = Colors.dark;
  const pathname = usePathname();
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
      <View style={[styles.container, styles.centered, styles.errorPadding, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle" style={styles.centerText}>
          Profil nicht gefunden
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {profileError}
        </ThemedText>
        <Pressable onPress={() => retryProfileLoad()} style={[styles.retryButton, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={styles.retryButtonText}>
            Erneut versuchen
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => signOut()}>
          <ThemedText type="small" style={{ color: theme.danger }}>
            Abmelden
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!activeUserId) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <FloatingTabBar tabs={TABS} pathname={pathname} onSelect={(href) => router.replace(href)} />
    </View>
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
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  retryButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
