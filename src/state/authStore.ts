import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthProfile {
  id: string;
  username: string;
  avatarEmoji: string;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: AuthProfile | null;
  /** Set when signed in but the profile row couldn't be loaded - almost always means supabase/schema.sql hasn't been run yet. */
  profileError: string | null;
  error: string | null;
  init: () => void;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  retryProfileLoad: () => Promise<void>;
  clearError: () => void;
}

async function loadProfile(userId: string): Promise<{ profile: AuthProfile | null; error: string | null }> {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar_emoji').eq('id', userId).single();
  if (error || !data) {
    return {
      profile: null,
      error:
        `Profil konnte nicht geladen werden (${error?.message ?? 'kein Eintrag'}). ` +
        'Wurde supabase/schema.sql schon im SQL-Editor des Supabase-Projekts ausgeführt?',
    };
  }
  return { profile: { id: data.id, username: data.username, avatarEmoji: data.avatar_emoji }, error: null };
}

/** Friendly German text for the handful of Supabase auth errors a signup/login form actually hits. */
function friendlyAuthError(message: string): string {
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Für diese E-Mail existiert bereits ein Account.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'E-Mail oder Passwort ist falsch.';
  }
  if (message.includes('Password should be at least')) {
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  }
  if (message.includes('duplicate key') && message.includes('username')) {
    return 'Dieser Benutzername ist schon vergeben.';
  }
  return message;
}

const NOT_CONFIGURED_ERROR = 'Backend ist noch nicht verbunden - trag EXPO_PUBLIC_SUPABASE_URL/ANON_KEY in .env ein.';

/**
 * Where confirmation/reset links should send people back to - derived from
 * wherever the app is actually running (GitHub Pages subpath, a future
 * custom domain, local dev) instead of Supabase's dashboard "Site URL",
 * which defaults to http://localhost:3000 and is easy to forget to update.
 */
function getAppUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const basePath = process.env.EXPO_BASE_URL ?? '';
  return `${window.location.origin}${basePath}/`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  profile: null,
  profileError: null,
  error: null,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signedOut' });
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { profile, error } = await loadProfile(data.session.user.id);
        set({ session: data.session, profile, profileError: error, status: 'signedIn' });
      } else {
        set({ status: 'signedOut' });
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { profile, error } = await loadProfile(session.user.id);
        set({ session, profile, profileError: error, status: 'signedIn' });
      } else {
        set({ session: null, profile: null, profileError: null, status: 'signedOut' });
      }
    });
  },

  retryProfileLoad: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const { profile, error } = await loadProfile(userId);
    set({ profile, profileError: error });
  },

  signUp: async (email, password, username) => {
    set({ error: null });
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED_ERROR });
      return { error: NOT_CONFIGURED_ERROR };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, avatar_emoji: '🙂' }, emailRedirectTo: getAppUrl() },
    });
    const message = error ? friendlyAuthError(error.message) : null;
    set({ error: message });
    return { error: message };
  },

  signIn: async (email, password) => {
    set({ error: null });
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED_ERROR });
      return { error: NOT_CONFIGURED_ERROR };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    const message = error ? friendlyAuthError(error.message) : null;
    set({ error: message });
    return { error: message };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    set({ error: null });
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED_ERROR });
      return { error: NOT_CONFIGURED_ERROR };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getAppUrl() });
    const message = error ? friendlyAuthError(error.message) : null;
    set({ error: message });
    return { error: message };
  },

  updatePassword: async (newPassword) => {
    set({ error: null });
    if (!isSupabaseConfigured) {
      set({ error: NOT_CONFIGURED_ERROR });
      return { error: NOT_CONFIGURED_ERROR };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    const message = error ? friendlyAuthError(error.message) : null;
    set({ error: message });
    return { error: message };
  },

  clearError: () => set({ error: null }),
}));
