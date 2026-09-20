import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { getTodaysGroupIdFor, hasHourglassForGroup, latestAnswers, myGuessStatus, useAppStore } from '@/state/appStore';
import { Friend, QuestionGroup } from '@/types';

function FriendGroupItem({ friend, group, isToday }: { friend: Friend; group: QuestionGroup; isToday: boolean }) {
  const status = useAppStore((state) => myGuessStatus(state, friend.id, group.id));
  const pending = useAppStore((state) => hasHourglassForGroup(state, friend.id, group.id));
  const score = useAppStore((state) => {
    const truth = latestAnswers(state.history[friend.id]?.[group.id]);
    const guess = state.myGuesses[friend.id]?.[group.id];
    if (!truth || !guess) return null;
    return group.questions.filter((question) => guess[question.id] === truth[question.id]).length;
  });

  let subtitle: string;
  if (status === 'not_guessed') {
    subtitle = 'Noch nicht geraten';
  } else if (status === 'waiting_for_truth') {
    subtitle = `Wartet auf ${friend.name}`;
  } else {
    subtitle = `${score} / ${group.questions.length} richtig geraten`;
  }
  if (isToday) {
    subtitle += ` · ${friend.name}s Thema heute`;
  }

  return (
    <ListRow
      icon={group.icon}
      title={group.name}
      subtitle={subtitle}
      trailing={pending ? <ThemedText type="small">⏳</ThemedText> : undefined}
      onPress={() =>
        router.push({
          pathname: '/friend/[id]/group/[groupId]',
          params: { id: friend.id, groupId: group.id },
        })
      }
    />
  );
}

export default function FriendGroupsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friend = useAppStore((state) => state.friends.find((f) => f.id === id));
  const groups = useAppStore((state) => state.groups);
  const now = useEffectiveNow();
  const todaysGroupId = id && now ? getTodaysGroupIdFor(id, groups, now) : undefined;

  if (!friend) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Diesen Freund gibt es nicht (mehr).</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <ThemedText style={styles.headerEmoji}>{friend.avatarEmoji}</ThemedText>
            <ThemedText type="subtitle">{friend.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              🔥 {friend.streak} Tage Streak
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            Themen
          </ThemedText>
          <View style={styles.groupList}>
            {groups.map((group) => (
              <FriendGroupItem
                key={group.id}
                friend={friend}
                group={group}
                isToday={group.id === todaysGroupId}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  headerEmoji: {
    fontSize: 48,
  },
  sectionLabel: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  groupList: {
    gap: Spacing.one,
  },
});
