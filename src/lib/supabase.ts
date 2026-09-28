import 'react-native-url-polyfill/auto';
import '@/lib/webCryptoShim';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until a real Supabase project is wired up via .env (see .env.example). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set - ' +
      'auth and the database are disabled until .env is filled in (see .env.example).',
  );
}

// expo-router server-renders pages in Node during dev/export - both storage
// backends below reach for a browser/native API eagerly and crash there, so
// neither can be used until we're actually running in a browser or on-device.
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

/**
 * SecureStore's Keychain/Keystore backing caps a value at ~2048 bytes, which
 * a Supabase session (access + refresh token + user object) regularly
 * exceeds. The standard workaround (see Supabase's Expo guide): encrypt the
 * session with a random AES key, store the small key in SecureStore and the
 * (unbounded-size) ciphertext in AsyncStorage.
 *
 * Hardening on top of the guide's version:
 * - aes-js's utf8 helpers mangle 4-byte characters, so the session's
 *   avatar_emoji (e.g. 🙂) came back as broken JSON - Supabase then quietly
 *   treated the user as signed out, the profile query ran anonymous, and RLS
 *   hid the user's own row. The value is percent-encoded to pure ASCII
 *   before encryption, which aes-js round-trips losslessly.
 * - Every write picks a fresh key, so two overlapping writes could leave key
 *   A next to ciphertext B. All operations run one at a time via `queue`.
 * - AES-CTR has no integrity check, so a mismatched or outdated entry
 *   decrypts to garbage instead of failing. A known prefix makes that
 *   detectable; a bad entry is dropped, which just means signing in again.
 */
const INTEGRITY_PREFIX = 'dyk2:';

class LargeSecureStore {
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = Crypto.getRandomBytes(256 / 8);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(INTEGRITY_PREFIX + encodeURIComponent(value)));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    try {
      const decrypted = aesjs.utils.utf8.fromBytes(decryptedBytes);
      if (!decrypted.startsWith(INTEGRITY_PREFIX)) return null;
      return decodeURIComponent(decrypted.slice(INTEGRITY_PREFIX.length));
    } catch {
      return null;
    }
  }

  private async removeBoth(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }

  getItem(key: string): Promise<string | null> {
    return this.enqueue(async () => {
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;
      const decrypted = await this.decrypt(key, encrypted);
      if (decrypted === null) await this.removeBoth(key);
      return decrypted;
    });
  }

  setItem(key: string, value: string): Promise<void> {
    return this.enqueue(async () => {
      const encrypted = await this.encrypt(key, value);
      await AsyncStorage.setItem(key, encrypted);
    });
  }

  removeItem(key: string): Promise<void> {
    return this.enqueue(() => this.removeBoth(key));
  }
}

// SecureStore has no real native Keychain/Keystore backing on web (its web
// shim is an unencrypted localStorage wrapper), so there's nothing to gain
// there over plain AsyncStorage - keep the simpler path for web/SSR and only
// pay for encryption on native, where it actually buys something.
const authStorage =
  typeof window === 'undefined' ? noopStorage : Platform.OS === 'web' ? AsyncStorage : new LargeSecureStore();

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web: let auth-js pick up the #access_token a confirmation/reset link
    // lands with (it was false everywhere before, so a web password reset
    // opened the app signed out). A reset link fires PASSWORD_RECOVERY,
    // which the root layout routes to /settings/password.
    // Native: deep links are exchanged by hand in authStore.handleAuthLink
    // with the PKCE flow - see src/lib/authLinking.ts for why.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
  },
});
