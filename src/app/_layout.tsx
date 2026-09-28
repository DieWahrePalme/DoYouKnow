import { useLinkingURL } from 'expo-linking';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';

/** How often a signed-in client checks whether Berlin midnight has passed. */
const DAY_ROLLOVER_CHECK_MS = 15 * 1000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const status = useAuthStore((state) => state.status);
  const init = useAuthStore((state) => state.init);
  const checkDayRollover = useAppStore((state) => state.checkDayRollover);
  const handleAuthLink = useAuthStore((state) => state.handleAuthLink);
  const pendingPasswordRecovery = useAuthStore((state) => state.pendingPasswordRecovery);
  const clearPendingPasswordRecovery = useAuthStore((state) => state.clearPendingPasswordRecovery);
  const linkingUrl = useLinkingURL();

  useEffect(() => {
    init();
  }, [init]);

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

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            title: '',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={status !== 'signedIn'}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
