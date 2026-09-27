import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { getAuthRedirectUrl, parseAuthLink } from '@/lib/authLinking';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppStore } from '@/state/appStore';

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
  /** Set when the user arrived via a password-reset link - the root layout sends them to the change-password screen once signed in. */
  pendingPasswordRecovery: boolean;
  init: () => void;
  /** Signs in from a confirmation/reset deep link (native only - on web these land as a normal page load). */
  handleAuthLink: (url: string) => Promise<void>;
  clearPendingPasswordRecovery: () => void;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  profile: null,
  profileError: null,
  error: null,
  pendingPasswordRecovery: false,

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
        useAppStore.getState().resetForSignOut();
        set({ status: 'signedOut' });
      }
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') set({ pendingPasswordRecovery: true });
      if (session) {
        const { profile, error } = await loadProfile(session.user.id);
        set({ session, profile, profileError: error, status: 'signedIn' });
      } else {
        // Also fires when switching accounts in the same tab (sign out ->
        // sign in as someone else) - without this, the previous account's
        // profile stayed in appStore's `users` map and showed up as a
        // phantom friend for whoever signs in next.
        useAppStore.getState().resetForSignOut();
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
      options: { data: { username, avatar_emoji: '🙂' }, emailRedirectTo: getAuthRedirectUrl() },
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl() });
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

  handleAuthLink: async (url) => {
    if (!isSupabaseConfigured) return;
    const link = parseAuthLink(url);
    if (link.kind === 'none') return;
    if (link.kind === 'error') {
      set({ error: `Der Link ist ungültig oder abgelaufen (${link.message}).` });
      return;
    }
    // On success onAuthStateChange takes it from here (signedIn, plus
    // pendingPasswordRecovery for a reset link).
    const { error } = await supabase.auth.exchangeCodeForSession(link.code);
    if (error) set({ error: `Der Link konnte nicht eingelöst werden (${error.message}).` });
  },

  clearPendingPasswordRecovery: () => set({ pendingPasswordRecovery: false }),

  clearError: () => set({ error: null }),
}));
