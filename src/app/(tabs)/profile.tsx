import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AVATAR_CHOICES } from '@/data/mockData';
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
import { ME_ID, QuestionGroup } from '@/types';
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

function GroupTile({ group, isToday }: { group: QuestionGroup; isToday: boolean }) {
  const theme = useTheme();
  const historyForGroup = useAppStore((state) => state.history[ME_ID]?.[group.id]);
  const now = useEffectiveNow();
  const waitingCount = useAppStore(
    (state) =>
      state.friends.filter((friend) => theirGuessStatus(state, friend.id, group.id) === 'waiting_for_truth')
        .length,
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
  const profile = useAppStore((state) => state.profile);
  const groups = useAppStore((state) => state.groups);
  const friendCount = useAppStore((state) => state.friends.length);
  const answeredCount = useAppStore((state) => answeredGroupCount(state));
  const collectedCount = useAppStore((state) => totalGuessesCollected(state));
  const updateProfileName = useAppStore((state) => state.updateProfileName);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);
  const now = useEffectiveNow();
  const todaysGroupId = now ? getTodaysGroupIdFor(ME_ID, groups, now) : groups[0].id;

  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const nameInputRef = useRef<TextInput>(null);
  const hasCommittedRef = useRef(false);

  function startEditingName() {
    hasCommittedRef.current = false;
    setNameDraft(profile.name);
    setIsEditingName(true);
  }

  function commitName() {
    if (hasCommittedRef.current) return;
    hasCommittedRef.current = true;
    const trimmed = nameDraft.trim();
    if (trimmed) {
      updateProfileName(trimmed);
    }
    setIsEditingName(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => setIsPickingAvatar((v) => !v)}
              style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.avatarEmoji}>{profile.avatarEmoji}</ThemedText>
              <View style={[styles.editBadge, { backgroundColor: theme.background }]}>
                <ThemedText style={styles.editBadgeText}>✎</ThemedText>
              </View>
            </Pressable>

            <View style={styles.stats}>
              <StatColumn value={friendCount} label="Freunde" />
              <StatColumn value={answeredCount} label="Beantwortet" />
              <StatColumn value={collectedCount} label="Gesammelt" />
            </View>
          </View>

          {isEditingName ? (
            <TextInput
              ref={nameInputRef}
              autoFocus
              value={nameDraft}
              onChangeText={setNameDraft}
              onSubmitEditing={() => nameInputRef.current?.blur()}
              onBlur={commitName}
              style={[styles.nameInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
          ) : (
            <Pressable onPress={startEditingName} style={styles.nameRow}>
              <ThemedText type="subtitle">{profile.name} ✎</ThemedText>
            </Pressable>
          )}

          {isPickingAvatar ? (
            <View style={styles.avatarGrid}>
              {AVATAR_CHOICES.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    updateProfileAvatar(emoji);
                    setIsPickingAvatar(false);
                  }}
                  style={[styles.avatarChoice, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText style={styles.avatarChoiceEmoji}>{emoji}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            Deine Themen
          </ThemedText>
          <View style={styles.grid}>
            {groups.map((group) => (
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.four,
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
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: 12,
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
  nameRow: {
    marginTop: Spacing.three,
  },
  nameInput: {
    marginTop: Spacing.three,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    borderBottomWidth: 2,
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChoiceEmoji: {
    fontSize: 20,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
