import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useAppStore } from '@/state/appStore';
import { useAuthStore } from '@/state/authStore';

/** How often every signed-in client re-checks the shared test_clock, so an account's time jump reaches everyone else's screen. */
const GLOBAL_CLOCK_POLL_MS = 15 * 1000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const status = useAuthStore((state) => state.status);
  const init = useAuthStore((state) => state.init);
  const hydrateTimeOffset = useAppStore((state) => state.hydrateTimeOffset);
  const loadGlobalTimeOffset = useAppStore((state) => state.loadGlobalTimeOffset);

  useEffect(() => {
    init();
    void hydrateTimeOffset();
  }, [init, hydrateTimeOffset]);

  // The local cache above only avoids a flash of real time on startup - once
  // signed in, the shared Supabase row is authoritative, and polling here
  // (rather than only on Home) keeps every screen's "now" in sync even while
  // sitting on a friend's guess screen or Profile.
  useEffect(() => {
    if (status !== 'signedIn') return;
    void loadGlobalTimeOffset();
    const interval = setInterval(() => void loadGlobalTimeOffset(), GLOBAL_CLOCK_POLL_MS);
    return () => clearInterval(interval);
  }, [status, loadGlobalTimeOffset]);

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
