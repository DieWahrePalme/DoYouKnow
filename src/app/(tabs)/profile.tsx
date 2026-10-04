import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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

function StatColumn({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const content = (
    <>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel} numberOfLines={1}>
        {label}
      </ThemedText>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.statColumn} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.statColumn}>{content}</View>;
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.primary : 'transparent',
          borderColor: active ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: active ? theme.primaryText : theme.text }}>
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
      style={[styles.tile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {isToday ? (
        <View style={[styles.todayBadge, { backgroundColor: theme.primary }]}>
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
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.avatarEmoji}>{profile.avatarEmoji}</ThemedText>
            </View>

            <View style={styles.stats}>
              <StatColumn value={friendCount} label="Freunde" onPress={() => router.push('/friends')} />
              <StatColumn value={answeredCount} label="Beantwortet" />
              <StatColumn value={collectedCount} label="Gesammelt" />
            </View>

            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Einstellungen"
              style={[styles.menuButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Ionicons name="menu" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText style={styles.username} numberOfLines={1}>
            {profile.name}
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}>
            <CategoryChip label="Alle" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
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
    paddingBottom: BottomTabInset + Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: '#F5F5F7',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: '#F5F5F7',
    marginTop: Spacing.three,
  },
  chipRow: {
    marginTop: Spacing.three,
    marginHorizontal: -Spacing.three,
  },
  chipRowContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  tile: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: Spacing.one,
  },
  tileBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tileBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    lineHeight: 14,
  },
  todayBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    lineHeight: 13,
    color: '#FFFFFF',
  },
  tileIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  tileName: {
    textAlign: 'center',
    fontSize: 13,
  },
});
