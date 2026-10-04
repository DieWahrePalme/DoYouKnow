import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'appearance-preference';

interface AppearanceState {
  preference: AppearancePreference;
  /** False until the saved choice has been read, so the app doesn't flash the wrong scheme at startup. */
  loaded: boolean;
  /** Reads the saved choice once at startup (the default, "system", applies until it arrives). */
  load: () => Promise<void>;
  setPreference: (preference: AppearancePreference) => void;
}

function isPreference(value: string | null): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  preference: 'system',
  loaded: false,
  load: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (isPreference(saved)) set({ preference: saved });
    } catch {
      // Storage unavailable: keep following the system setting.
    }
    set({ loaded: true });
  },
  setPreference: (preference) => {
    set({ preference });
    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {
      // Not saved: the choice still applies for this session.
    });
  },
}));
