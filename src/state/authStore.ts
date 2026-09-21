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
  error: string | null;
  init: () => void;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  clearError: () => void;
}

async function loadProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar_emoji').eq('id', userId).single();
  if (error || !data) return null;
  return { id: data.id, username: data.username, avatarEmoji: data.avatar_emoji };
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

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  error: null,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signedOut' });
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const profile = await loadProfile(data.session.user.id);
        set({ session: data.session, profile, status: 'signedIn' });
      } else {
        set({ status: 'signedOut' });
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await loadProfile(session.user.id);
        set({ session, profile, status: 'signedIn' });
      } else {
        set({ session: null, profile: null, status: 'signedOut' });
      }
    });
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
      options: { data: { username, avatar_emoji: '🙂' } },
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    const message = error ? friendlyAuthError(error.message) : null;
    set({ error: message });
    return { error: message };
  },

  clearError: () => set({ error: null }),
}));
