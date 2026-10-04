import { Redirect } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
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
  { key: 'home', label: 'Heute', icon: 'flame' as const },
  { key: 'match', label: 'Match', icon: 'git-compare' as const },
  { key: 'favorites', label: 'Favoriten', icon: 'star' as const },
  { key: 'profile', label: 'Profil', icon: 'person' as const },
];

const SCREENS = { home: HomeScreen, match: MatchScreen, favorites: FavoritesScreen, profile: ProfileScreen };

/** Dev-only (routes in src/app/design-preview/): tab screens with fake users so the design can be checked without a Supabase login. */
/** Seeds fake users into the stores (once) and reports when the screen can render. */
export function useSeededPreviewStore(): boolean {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!__DEV__) return;
    // No Supabase session here: keep the fake users instead of letting a fetch replace them.
    const lea = { id: 'lea', name: 'Lea', avatarEmoji: '🦋' };
    const mia = { id: 'mia', name: 'mia_k', avatarEmoji: '🌸' };
    const ben = { id: 'ben', name: 'benji', avatarEmoji: '🐼' };
    useFriendsStore.setState({
      fetchAll: async () => {},
      fetchBlocked: async () => {},
      searchUsers: async () => {},
      incomingRequests: [
        { friendshipId: 'r1', from: mia },
        { friendshipId: 'r2', from: ben },
      ],
      blockedUsers: [{ id: 'x', name: 'spam_bot', avatarEmoji: '🤖' }],
      outgoingPendingIds: ['lea'],
      searchResults: [lea, mia, ben],
    });
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
    // Same answers for me and Tom on the first groups, so Match has something to show.
    const { groups } = useAppStore.getState();
    const at = new Date().toISOString();
    const values = ['yes', 'leanNo', 'leanYes', 'no', 'yes'] as const;
    const history: Record<string, Record<string, Record<string, { value: (typeof values)[number]; at: string }[]>>> = {
      me: {},
      tom: {},
    };
    groups.slice(0, 6).forEach((group, g) => {
      history.me[group.id] = {};
      history.tom[group.id] = {};
      group.questions.forEach((q, i) => {
        history.me[group.id][q.id] = [{ value: values[i], at }];
        history.tom[group.id][q.id] = [{ value: (g + i) % 3 === 0 ? values[(i + 1) % 5] : values[i], at }];
      });
    });
    useAppStore.setState({ history });
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
      <FloatingTabBar tabs={TABS} activeKey={screen} onSelect={() => {}} />
    </View>
  );
}

/** Dev-only: renders any screen component after seeding fake users (query params still reach the screen). */
export function SeededScreen({ children }: { children: ReactNode }) {
  const seeded = useSeededPreviewStore();
  if (!__DEV__) return <Redirect href="/" />;
  return seeded ? <>{children}</> : null;
}
