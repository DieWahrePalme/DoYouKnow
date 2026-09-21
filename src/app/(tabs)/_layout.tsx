import { Href, Slot, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';
import { useFriendsStore } from '@/state/friendsStore';

interface TabDef {
  href: Href;
  isActive: (pathname: string) => boolean;
  emoji: string | null;
  label: string;
}

const TABS: TabDef[] = [
  { href: '/', isActive: (p) => p === '/', emoji: '🏠', label: 'Home' },
  { href: '/match', isActive: (p) => p === '/match', emoji: '🤝', label: 'Match' },
  { href: '/favorites', isActive: (p) => p === '/favorites', emoji: '⭐', label: 'Favoriten' },
  { href: '/profile', isActive: (p) => p === '/profile', emoji: null, label: 'Profil' },
];

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const pathname = usePathname();
  const authProfile = useAuthStore((state) => state.profile);
  const profileError = useAuthStore((state) => state.profileError);
  const retryProfileLoad = useAuthStore((state) => state.retryProfileLoad);
  const signOut = useAuthStore((state) => state.signOut);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const syncRealUser = useAppStore((state) => state.syncRealUser);
  const avatarEmoji = useAppStore((state) => state.users[state.activeUserId]?.avatarEmoji);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Slot />
      </View>
      <SafeAreaView
        edges={['bottom']}
        style={[styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.backgroundSelected }]}>
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <Pressable key={tab.label} style={styles.tabButton} onPress={() => router.replace(tab.href)}>
              <Text style={[styles.tabEmoji, { opacity: active ? 1 : 0.5 }]}>{tab.emoji ?? avatarEmoji}</Text>
              <Text style={[styles.tabLabel, { color: active ? theme.text : theme.textSecondary }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </SafeAreaView>
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    gap: 2,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
