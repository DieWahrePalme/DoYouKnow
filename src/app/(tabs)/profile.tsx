import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/data/mockData';
import { useEffectiveNow } from '@/hooks/use-effective-now';
import { useTheme } from '@/hooks/use-theme';
import {
  answeredGroupCount,
  getTodaysGroupIdFor,
  latestAnswers,
  theirGuessStatus,
  totalGuessesCollected,
  useAppStore,
} from '@/state/appStore';
import { QuestionGroup } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

function StatColumn({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statColumn}>
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function CategoryChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.primary : theme.backgroundElement },
      ]}>
      <ThemedText style={styles.chipIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function GroupTile({ group, isToday }: { group: QuestionGroup; isToday: boolean }) {
  const theme = useTheme();
  const historyForGroup = useAppStore((state) => state.history[state.activeUserId]?.[group.id]);
  const now = useEffectiveNow();
  const waitingCount = useAppStore(
    (state) =>
      Object.keys(state.users).filter(
        (userId) => userId !== state.activeUserId && theirGuessStatus(state, userId, group.id) === 'waiting_for_truth',
      ).length,
  );

  const currentAnswers = latestAnswers(historyForGroup);
  let caption: string;
  if (!currentAnswers) {
    caption = 'Offen';
  } else if (!now) {
    caption = '';
  } else {
    const mostRecentAt = Object.values(historyForGroup!)
      .map((entries) => entries[entries.length - 1].at)
      .sort()
      .at(-1)!;
    caption = formatRelative(mostRecentAt, now);
  }

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/group/[groupId]', params: { groupId: group.id } })}
      style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
      {isToday ? (
        <View style={[styles.todayBadge, { backgroundColor: theme.background, borderColor: theme.text }]}>
          <ThemedText style={styles.todayBadgeText}>Heute</ThemedText>
        </View>
      ) : null}
      {waitingCount > 0 ? (
        <View style={[styles.tileBadge, { backgroundColor: theme.text }]}>
          <ThemedText style={[styles.tileBadgeText, { color: theme.background }]}>{waitingCount}</ThemedText>
        </View>
      ) : null}
      <ThemedText style={styles.tileIcon}>{group.icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.tileName} numberOfLines={1}>
        {group.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const activeUserId = useAppStore((state) => state.activeUserId);
  const profile = useAppStore((state) => state.users[state.activeUserId]);
  const groups = useAppStore((state) => state.groups);
  const friendCount = useAppStore((state) => Object.keys(state.users).length - 1);
  const answeredCount = useAppStore((state) => answeredGroupCount(state));
  const collectedCount = useAppStore((state) => totalGuessesCollected(state));
  const now = useEffectiveNow();
  const todaysGroupId = now ? getTodaysGroupIdFor(activeUserId, groups, now) : groups[0].id;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const visibleGroups = activeCategory ? groups.filter((g) => g.category === activeCategory) : groups;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              style={[styles.menuButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.menuIcon}>☰</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.username}>
            {profile.name}
          </ThemedText>

          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.avatarEmoji}>{profile.avatarEmoji}</ThemedText>
            </View>

            <View style={styles.stats}>
              <StatColumn value={friendCount} label="Freunde" />
              <StatColumn value={answeredCount} label="Beantwortet" />
              <StatColumn value={collectedCount} label="Gesammelt" />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
            <CategoryChip icon="✨" label="Alle" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                icon={category.icon}
                label={category.name}
                active={activeCategory === category.id}
                onPress={() => setActiveCategory(category.id)}
              />
            ))}
          </ScrollView>

          <View style={styles.grid}>
            {visibleGroups.map((group) => (
              <GroupTile key={group.id} group={group} isToday={group.id === todaysGroupId} />
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  topBarSpacer: {
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  username: {
    marginTop: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 38,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
  },
  chipRow: {
    marginTop: Spacing.four,
  },
  chipRowContent: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  chipIcon: {
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  tile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: Spacing.one,
  },
  tileBadge: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  todayBadge: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tileIcon: {
    fontSize: 26,
  },
  tileName: {
    textAlign: 'center',
  },
});
