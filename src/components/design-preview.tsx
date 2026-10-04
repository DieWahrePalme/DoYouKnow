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
import { guessDayKey } from '@/utils/streak';

const TABS = [
  { href: '/' as const, label: 'Heute', icon: 'flame' as const, screen: 'home' },
  { href: '/match' as const, label: 'Match', icon: 'git-compare' as const, screen: 'match' },
  { href: '/favorites' as const, label: 'Favoriten', icon: 'star' as const, screen: 'favorites' },
  { href: '/profile' as const, label: 'Profil', icon: 'person' as const, screen: 'profile' },
];

const SCREENS = { home: HomeScreen, match: MatchScreen, favorites: FavoritesScreen, profile: ProfileScreen };

/** Dev-only (routes in src/app/design-preview/): tab screens with fake users so the design can be checked without a Supabase login. */
/** Seeds fake users into the stores (once) and reports when the screen can render. */
export function useSeededPreviewStore(): boolean {
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

  return seeded;
}

/** Overview of an answered card: seeds answers (with a changed one) and a friend's guess for group "sport" or the first group. */
export function useSeededAnswers(): string | null {
  const seeded = useSeededPreviewStore();
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!seeded) return;
    const state = useAppStore.getState();
    const group = state.groups[1] ?? state.groups[0];
    const at = new Date().toISOString();
    const earlier = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString();
    const values = ['yes', 'leanNo', 'leanYes', 'no', 'yes'] as const;
    const mine: Record<string, { value: (typeof values)[number]; at: string }[]> = {};
    const tomGuess: Record<string, (typeof values)[number]> = {};
    group.questions.forEach((q, i) => {
      mine[q.id] = i === 1 ? [{ value: 'yes', at: earlier }, { value: values[i], at }] : [{ value: values[i], at }];
      tomGuess[q.id] = values[(i + (i % 2)) % 5];
    });
    useAppStore.setState({
      history: { me: { [group.id]: mine } },
      guesses: { tom: { me: { [group.id]: tomGuess } } },
      guessDays: { [guessDayKey('tom', 'me', state.today)]: { groupId: group.id, at } },
    });
    setGroupId(group.id);
  }, [seeded]);

  return groupId;
}

export function DesignPreviewScreen({ screen }: { screen: keyof typeof SCREENS }) {
  const seeded = useSeededPreviewStore();

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
