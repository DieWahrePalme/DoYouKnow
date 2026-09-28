import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Push notifications ("result ready", "someone guessed you", 22:00 streak
 * reminder) are sent by Postgres through Expo's push service - see the push
 * section of supabase/schema.sql. The app only has to ask for permission
 * and hand its Expo push token to the signed-in account.
 *
 * Native only (web gets the no-op pushNotifications.ts, so expo-notifications
 * is never loaded there). In Expo Go this works on iOS without an Apple
 * Developer account (Expo Go uses Expo's own credentials); Android needs a
 * dev build.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

/** Asks for permission (once - iOS remembers the answer) and links this device's push token to the signed-in account. */
export async function registerForPushNotifications(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[push] no EAS projectId in app config - push disabled');
    return;
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token });
    if (error) {
      console.error('[push] token registration failed:', error.message);
      return;
    }
    registeredToken = token;
  } catch (err) {
    // Simulators have no push token - that's expected, not an app error.
    console.warn('[push] could not get a push token:', err);
  }
}

/** Unlinks this device before signing out, so the next person on this phone doesn't get the previous account's pushes. */
export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;
  const { error } = await supabase.rpc('unregister_push_token', { p_token: registeredToken });
  if (error) console.error('[push] token unregistration failed:', error.message);
  registeredToken = null;
}
