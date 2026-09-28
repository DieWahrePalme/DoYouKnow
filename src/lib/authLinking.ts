import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Where confirmation/reset links should send people back to.
 *
 * Web: derived from wherever the app is actually running (GitHub Pages
 * subpath, a future custom domain, local dev) instead of Supabase's
 * dashboard "Site URL", which defaults to http://localhost:3000 and is easy
 * to forget to update.
 *
 * Native: a deep link into the app - `doyouknow:///` in a real build,
 * `exp://<lan-ip>:8081/--/` in Expo Go. Either one must be on the Supabase
 * project's Redirect URLs allow-list, or Supabase silently falls back to the
 * Site URL.
 */
export function getAuthRedirectUrl(): string | undefined {
  if (Platform.OS !== 'web') return Linking.createURL('/');
  if (typeof window === 'undefined') return undefined;
  const basePath = process.env.EXPO_BASE_URL ?? '';
  return `${window.location.origin}${basePath}/`;
}

export type AuthLinkResult = { kind: 'code'; code: string } | { kind: 'error'; message: string } | { kind: 'none' };

/**
 * Native uses Supabase's PKCE flow (see src/lib/supabase.ts), so a
 * confirmation/reset link comes back as `?code=...` - useless without the
 * code verifier this device stored when it requested the email. That's the
 * point: the implicit flow's `#access_token=...` would let anyone craft a
 * doyouknow:// link that silently signs the victim into the attacker's
 * account. Errors (e.g. an expired link) arrive as `error_description` in
 * the query or the fragment, so both are read.
 */
export function parseAuthLink(url: string): AuthLinkResult {
  const [beforeHash, fragment = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  const params = new URLSearchParams(`${query}&${fragment}`);

  const errorDescription = params.get('error_description') ?? params.get('error');
  if (errorDescription) return { kind: 'error', message: errorDescription };

  const code = params.get('code');
  return code ? { kind: 'code', code } : { kind: 'none' };
}
