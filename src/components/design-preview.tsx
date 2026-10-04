import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import FavoritesScreen from '@/app/(tabs)/favorites';
import HomeScreen from '@/app/(tabs)/index';
import MatchScreen from '@/app/(tabs)/match';
import ProfileScreen from '@/app/(tabs)/profile';
import { FloatingTabBar } from '@/components/floating-tab-bar';
import { useAppStore } from '@/state/appStore';
import { useFriendsStore } from '@/state/friendsStore';

const TABS = [
  { href: '/' as const, label: 'Heute', icon: 'flame' as const, screen: 'home' },
  { href: '/match' as const, label: 'Match', icon: 'git-compare' as const, screen: 'match' },
  { href: '/favorites' as const, label: 'Favoriten', icon: 'star' as const, screen: 'favorites' },
  { href: '/profile' as const, label: 'Profil', icon: 'person' as const, screen: 'profile' },
];

const SCREENS = { home: HomeScreen, match: MatchScreen, favorites: FavoritesScreen, profile: ProfileScreen };

/** Dev-only (routes in src/app/design-preview/): tab screens with fake users so the design can be checked without a Supabase login. */
export function DesignPreviewScreen({ screen }: { screen: keyof typeof SCREENS }) {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!__DEV__) return;
    // No Supabase session here: keep the fake users instead of letting a fetch replace them.
    useFriendsStore.setState({ fetchAll: async () => {} });
    useAppStore.setState({
      resetForSignOut: () => {},
      users: {
        me: { id: 'me', name: 'moritz', avatarEmoji: '🦊' },
        tom: { id: 'tom', name: 'Tom', avatarEmoji: '🐨' },
        const: { id: 'const', name: 'Const', avatarEmoji: '🐙' },
        lea: { id: 'lea', name: 'Lea', avatarEmoji: '🦋' },
      },
      activeUserId: 'me',
    });
    setSeeded(true);
  }, []);

  if (!__DEV__) return <Redirect href="/" />;
  const Screen = SCREENS[screen];
  if (!seeded || !Screen) return null;

  return (
    <View style={{ flex: 1 }}>
      <Screen />
      <FloatingTabBar
        tabs={TABS.map((t) => ({ ...t, isActive: () => t.screen === screen }))}
        pathname=""
        onSelect={() => {}}
      />
    </View>
  );
}
