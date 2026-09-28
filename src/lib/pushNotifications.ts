/**
 * Web build of the push module: push notifications only exist in the native
 * app (see pushNotifications.native.ts). Keeping expo-notifications out of the
 * web bundle also keeps the static export from touching browser-only APIs.
 */
export async function registerForPushNotifications(): Promise<void> {}

export async function unregisterPushToken(): Promise<void> {}
