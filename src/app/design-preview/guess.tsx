import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { GuessHeader } from '@/components/guess-header';
import { SwipeDeck } from '@/components/swipe-deck';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Question } from '@/types';

const QUESTIONS: Question[] = [
  { id: 'p1', text: 'Ich schaue jedes Wochenende Fußball.' },
  { id: 'p2', text: 'Ich würde lieber im Stadion als auf dem Sofa zuschauen.' },
  { id: 'p3', text: 'Ich habe schon mal einen Marathon geplant.' },
  { id: 'p4', text: 'Ich gehe lieber allein trainieren.' },
  { id: 'p5', text: 'Ich kenne die Regeln von Handball.' },
];

const TABS = [
  { key: 'home', icon: 'flame' as const, label: 'Heute' },
  { key: 'match', icon: 'git-compare' as const, label: 'Match' },
  { key: 'favorites', icon: 'star' as const, label: 'Favoriten' },
  { key: 'profile', icon: 'person' as const, label: 'Profil' },
];

/** Dev-only: renders the guess screen with fake data so the design can be checked without a login. */
export default function DesignPreview() {
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SwipeDeck
          questions={QUESTIONS}
          onComplete={() => {}}
          header={<GuessHeader avatarEmoji="🦊" kicker="Du rätst für Tom" topicName="Sport" />}
        />
      </SafeAreaView>
      <FloatingTabBar tabs={TABS} activeKey="home" onSelect={() => {}} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 96 + Spacing.three,
  },
});
