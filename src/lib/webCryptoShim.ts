import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Supabase's PKCE flow (used on native, see src/lib/supabase.ts) needs
 * WebCrypto: `crypto.getRandomValues` for the code verifier and
 * `crypto.subtle.digest('SHA-256', ...)` for the challenge. React Native
 * doesn't provide `crypto.subtle`, so auth-js silently downgrades the
 * challenge to "plain" (and without `crypto` at all, the verifier to
 * Math.random). expo-crypto has native implementations of both - this
 * wires them into the global the way auth-js looks for them.
 *
 * Must be imported before the Supabase client makes its first PKCE request.
 */
interface ShimmableCrypto {
  getRandomValues?: typeof Crypto.getRandomValues;
  subtle?: { digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> };
}

function digest(algorithm: string, data: BufferSource): Promise<ArrayBuffer> {
  if (algorithm !== Crypto.CryptoDigestAlgorithm.SHA256) {
    return Promise.reject(new Error(`webCryptoShim: unsupported digest algorithm ${algorithm}`));
  }
  return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

if (Platform.OS !== 'web') {
  const globalWithCrypto = globalThis as { crypto?: ShimmableCrypto };
  const webCrypto = globalWithCrypto.crypto ?? {};
  globalWithCrypto.crypto = webCrypto;
  webCrypto.getRandomValues ??= Crypto.getRandomValues;
  webCrypto.subtle ??= { digest };
}
