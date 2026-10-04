import { useLinkingURL } from 'expo-linking';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FieldBackground } from '@/components/field-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAppearanceStore } from '@/state/appearanceStore';
import { registerForPushNotifications } from '@/lib/pushNotifications';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';

/**
 * Every screen that needs an account. Listing them inside Stack.Protected
 * (not just the tab group) matters: on sign-out or account deletion the
 * guard removes them from the stack - otherwise a pushed screen like
 * Settings stayed visible on top of the welcome screen. /privacy is left
 * out on purpose: the signup flow links to it while signed out.
 */
const SIGNED_IN_SCREENS = [
  'add-friend',
  'friend-requests',
  'friends',
  'friend/[id]/group/[groupId]',
  'friend/[id]/safety',
  'group/[groupId]',
  'match/[friendId]/index',
  'match/[friendId]/[categoryId]',
  'settings/index',
  'settings/avatar',
  'settings/blocked',
  'settings/delete-account',
  'settings/password',
  'settings/privacy',
  'settings/username',
] as const;

/** Navigation themes with a see-through background so the animated field shows behind every screen. */
const NAV_THEMES = {
  dark: { ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent' } },
  light: { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } },
};

/** How often a signed-in client checks whether Berlin midnight has passed. */
const DAY_ROLLOVER_CHECK_MS = 15 * 1000;

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const loadAppearance = useAppearanceStore((state) => state.load);
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const status = useAuthStore((state) => state.status);
  const init = useAuthStore((state) => state.init);
  const checkDayRollover = useAppStore((state) => state.checkDayRollover);
  const recordTodaysCard = useAppStore((state) => state.recordTodaysCard);
  const activeUserId = useAppStore((state) => state.activeUserId);
  const today = useAppStore((state) => state.today);
  const handleAuthLink = useAuthStore((state) => state.handleAuthLink);
  const pendingPasswordRecovery = useAuthStore((state) => state.pendingPasswordRecovery);
  const clearPendingPasswordRecovery = useAuthStore((state) => state.clearPendingPasswordRecovery);
  const linkingUrl = useLinkingURL();

  useEffect(() => {
    init();
    void loadAppearance();
  }, [init, loadAppearance]);

  // On native, confirmation/reset emails open the app via doyouknow:// (or
  // exp:// in Expo Go) with the session tokens in the URL - covers both a
  // cold start from the link and the app already running in the background.
  useEffect(() => {
    if (Platform.OS === 'web' || !linkingUrl) return;
    void handleAuthLink(linkingUrl);
  }, [linkingUrl, handleAuthLink]);

  useEffect(() => {
    if (status !== 'signedIn' || !pendingPasswordRecovery) return;
    clearPendingPasswordRecovery();
    router.push('/settings/password');
  }, [status, pendingPasswordRecovery, clearPendingPasswordRecovery]);

  // Moves `today` past Berlin midnight on every screen (not just Home) -
  // streaks, today's cards and useEffectiveNow all follow it.
  useEffect(() => {
    if (status !== 'signedIn') return;
    checkDayRollover();
    const interval = setInterval(checkDayRollover, DAY_ROLLOVER_CHECK_MS);
    return () => clearInterval(interval);
  }, [status, checkDayRollover]);

  useEffect(() => {
    if (status === 'signedIn') void registerForPushNotifications();
  }, [status]);

  // Tell the server which card is mine today (once per account per day).
  useEffect(() => {
    if (status === 'signedIn' && activeUserId) recordTodaysCard();
  }, [status, activeUserId, today, recordTodaysCard]);

  if (status === 'loading' || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <FieldBackground />
      <ThemeProvider value={NAV_THEMES[scheme]}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            title: '',
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {SIGNED_IN_SCREENS.map((name) => (
              <Stack.Screen key={name} name={name} />
            ))}
          </Stack.Protected>
          <Stack.Protected guard={status !== 'signedIn'}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
