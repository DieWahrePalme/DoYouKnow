import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AVATAR_CHOICES } from '@/data/mockData';
import { useTheme } from '@/hooks/use-theme';
import { latestAnswers, theirGuessStatus, useAppStore } from '@/state/appStore';
import { ME_ID, QuestionGroup } from '@/types';
import { formatRelative } from '@/utils/formatRelative';

function GroupListItem({ group }: { group: QuestionGroup }) {
  const historyForGroup = useAppStore((state) => state.history[ME_ID]?.[group.id]);
  const waitingCount = useAppStore(
    (state) =>
      state.friends.filter((friend) => theirGuessStatus(state, friend.id, group.id) === 'waiting_for_truth')
        .length,
  );

  const currentAnswers = latestAnswers(historyForGroup);
  let subtitle: string;
  if (!currentAnswers) {
    subtitle = 'Noch nicht beantwortet';
  } else {
    const mostRecentAt = Object.values(historyForGroup!)
      .map((entries) => entries[entries.length - 1].at)
      .sort()
      .at(-1)!;
    subtitle = `Zuletzt aktualisiert: ${formatRelative(mostRecentAt)}`;
  }
  if (waitingCount > 0) {
    subtitle += ` · ${waitingCount} Freund${waitingCount === 1 ? '' : 'e'} warten`;
  }

  return (
    <ListRow
      icon={group.icon}
      title={group.name}
      subtitle={subtitle}
      onPress={() => router.push({ pathname: '/group/[groupId]', params: { groupId: group.id } })}
    />
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useAppStore((state) => state.profile);
  const groups = useAppStore((state) => state.groups);
  const updateProfileName = useAppStore((state) => state.updateProfileName);
  const updateProfileAvatar = useAppStore((state) => state.updateProfileAvatar);

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
          <View style={styles.identity}>
            <Pressable
              onPress={() => setIsPickingAvatar((v) => !v)}
              style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.avatarEmoji}>{profile.avatarEmoji}</ThemedText>
              <View style={[styles.editBadge, { backgroundColor: theme.background }]}>
                <ThemedText style={styles.editBadgeText}>✎</ThemedText>
              </View>
            </Pressable>

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
              <Pressable onPress={startEditingName}>
                <ThemedText type="subtitle">{profile.name} ✎</ThemedText>
              </Pressable>
            )}
          </View>

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
          <View style={styles.groupList}>
            {groups.map((group) => (
              <GroupListItem key={group.id} group={group} />
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
  identity: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: 13,
  },
  nameInput: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
    borderBottomWidth: 2,
    minWidth: 160,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  avatarChoice: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChoiceEmoji: {
    fontSize: 22,
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  groupList: {
    gap: Spacing.one,
  },
});
