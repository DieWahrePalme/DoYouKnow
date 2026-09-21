import { create } from 'zustand';

import { CATEGORIES, FRIENDS, INITIAL_GUESSES, INITIAL_HISTORY, INITIAL_STREAKS, QUESTION_GROUPS } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { AnswerMap, Category, FavoriteItem, HistoryMap, QuestionGroup, UserProfile } from '@/types';
import { pairKey } from '@/utils/pairKey';

export type ResolutionStatus = 'not_guessed' | 'waiting_for_truth' | 'resolved';

interface AppState {
  /** Every known person: the signed-in real user plus the demo NPC friends. */
  users: Record<string, UserProfile>;
  /** Whoever "I" currently am - everything else in the app is relative to this. Empty until syncRealUser runs. */
  activeUserId: string;
  groups: QuestionGroup[];
  /** subjectId -> groupId -> HistoryMap. Missing group = never answered. */
  history: Record<string, Record<string, HistoryMap>>;
  /** guesserId -> subjectId -> groupId -> the guesser's guess about that subject. */
  guesses: Record<string, Record<string, Record<string, AnswerMap>>>;
  /** pairKey(a, b) -> streak between those two people. */
  streaks: Record<string, number>;
  streakBumpedToday: Record<string, boolean>;
  favorites: FavoriteItem[];
  /**
   * Manual offset from real wall-clock time, in ms - lets the day boundary
   * (and everything derived from it) be fast-forwarded for testing without
   * waiting for real midnight. A real backend would derive "now" from its
   * own clock/timezone instead of a client-side offset like this.
   */
  timeOffsetMs: number;
  /** The last calendar day (UTC) the streak/rollover check has processed. */
  lastProcessedDay: string;
  updateProfileName: (name: string) => void;
  updateProfileAvatar: (avatarEmoji: string) => void;
  submitSelfAnswers: (subjectId: string, groupId: string, answers: AnswerMap) => void;
  submitGuess: (subjectId: string, groupId: string, answers: AnswerMap) => void;
  toggleFavorite: (friendId: string, groupId: string, questionId: string) => void;
  advanceTimeBy: (ms: number) => void;
  jumpToNextDay: () => void;
  checkDayRollover: () => void;
  /** Makes the real signed-in account "you" in the app - called once after login/signup. */
  syncRealUser: (profile: UserProfile) => void;
  /** Adds a real accepted friend's profile to the roster so every screen that reads `users` picks them up. */
  mergeRealFriend: (profile: UserProfile) => void;
  /** Drops a friend from the local roster - called after the backing friendship row (if any) is deleted. */
  removeFriendFromUsers: (friendId: string) => void;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The app's current notion of "now" - always read through this, never `new Date()`/`Date.now()` directly. */
export function getEffectiveNow(state: AppState): Date {
  return new Date(Date.now() + state.timeOffsetMs);
}

export function msUntilNextDay(now: Date): number {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return next.getTime() - now.getTime();
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic per-person daily pick - different people get different groups, rotating at midnight. */
export function getTodaysGroupIdFor(subjectId: string, groups: QuestionGroup[], now: Date): string {
  const index = hashString(`${subjectId}:${dayKey(now)}`) % groups.length;
  return groups[index].id;
}

/** The current value per question, or undefined if this group was never completed. */
export function latestAnswers(historyForGroup: HistoryMap | undefined): AnswerMap | undefined {
  if (!historyForGroup) return undefined;
  const ids = Object.keys(historyForGroup);
  if (ids.length === 0) return undefined;
  const map: AnswerMap = {};
  for (const id of ids) {
    const entries = historyForGroup[id];
    map[id] = entries[entries.length - 1].value;
  }
  return map;
}

function statusOf(guess: AnswerMap | undefined, truth: AnswerMap | undefined): ResolutionStatus {
  if (!guess) return 'not_guessed';
  return truth ? 'resolved' : 'waiting_for_truth';
}

export const useAppStore = create<AppState>((set, get) => {
  function resolvedBetween(userAId: string, userBId: string, groupId: string): boolean {
    const state = get();
    const aGuessedB = statusOf(
      state.guesses[userAId]?.[userBId]?.[groupId],
      latestAnswers(state.history[userBId]?.[groupId]),
    );
    const bGuessedA = statusOf(
      state.guesses[userBId]?.[userAId]?.[groupId],
      latestAnswers(state.history[userAId]?.[groupId]),
    );
    return aGuessedB === 'resolved' || bGuessedA === 'resolved';
  }

  function bumpStreakIfResolved(userAId: string, userBId: string) {
    const state = get();
    const key = pairKey(userAId, userBId);
    if (state.streakBumpedToday[key]) return;

    const anyResolved = state.groups.some((group) => resolvedBetween(userAId, userBId, group.id));

    if (anyResolved) {
      set((s) => ({
        streaks: { ...s.streaks, [key]: (s.streaks[key] ?? 0) + 1 },
        streakBumpedToday: { ...s.streakBumpedToday, [key]: true },
      }));
    }
  }

  return {
    users: Object.fromEntries(FRIENDS.map((u) => [u.id, u])),
    activeUserId: '',
    groups: QUESTION_GROUPS,
    history: INITIAL_HISTORY,
    guesses: INITIAL_GUESSES,
    streaks: INITIAL_STREAKS,
    streakBumpedToday: {},
    favorites: [],
    timeOffsetMs: 0,
    lastProcessedDay: dayKey(new Date()),

    updateProfileName: (name) => {
      set((state) => ({
        users: { ...state.users, [state.activeUserId]: { ...state.users[state.activeUserId], name } },
      }));
      const userId = get().activeUserId;
      if (isSupabaseConfigured) void supabase.from('profiles').update({ username: name }).eq('id', userId);
    },
    updateProfileAvatar: (avatarEmoji) => {
      set((state) => ({
        users: { ...state.users, [state.activeUserId]: { ...state.users[state.activeUserId], avatarEmoji } },
      }));
      const userId = get().activeUserId;
      if (isSupabaseConfigured) void supabase.from('profiles').update({ avatar_emoji: avatarEmoji }).eq('id', userId);
    },

    advanceTimeBy: (ms) => {
      set((state) => ({ timeOffsetMs: state.timeOffsetMs + ms }));
      get().checkDayRollover();
    },

    jumpToNextDay: () => {
      const state = get();
      const delta = msUntilNextDay(getEffectiveNow(state)) + 1000;
      set({ timeOffsetMs: state.timeOffsetMs + delta });
      get().checkDayRollover();
    },

    checkDayRollover: () => {
      const state = get();
      const today = dayKey(getEffectiveNow(state));
      if (today === state.lastProcessedDay) return;
      // Nobody resolved anything for a pair during the day that just ended -> their flame goes out.
      set((s) => {
        const nextStreaks: Record<string, number> = {};
        for (const key of Object.keys(s.streaks)) {
          nextStreaks[key] = s.streakBumpedToday[key] ? s.streaks[key] : 0;
        }
        return { streaks: nextStreaks, streakBumpedToday: {}, lastProcessedDay: today };
      });
    },

    submitSelfAnswers: (subjectId, groupId, answers) => {
      const at = getEffectiveNow(get()).toISOString();
      set((state) => {
        const groupQuestions = state.groups.find((g) => g.id === groupId)?.questions ?? [];
        const existingForSubject = state.history[subjectId] ?? {};
        const existingForGroup = existingForSubject[groupId] ?? {};
        const updatedGroup: HistoryMap = {};
        for (const question of groupQuestions) {
          const prior = existingForGroup[question.id] ?? [];
          updatedGroup[question.id] = [...prior, { value: answers[question.id], at }];
        }
        return {
          history: {
            ...state.history,
            [subjectId]: { ...existingForSubject, [groupId]: updatedGroup },
          },
        };
      });

      // Answering can unlock any pending guess anyone else already made about this subject.
      for (const otherId of Object.keys(get().users)) {
        if (otherId !== subjectId) bumpStreakIfResolved(subjectId, otherId);
      }
    },

    submitGuess: (subjectId, groupId, answers) => {
      const guesserId = get().activeUserId;
      set((state) => ({
        guesses: {
          ...state.guesses,
          [guesserId]: {
            ...(state.guesses[guesserId] ?? {}),
            [subjectId]: { ...(state.guesses[guesserId]?.[subjectId] ?? {}), [groupId]: answers },
          },
        },
      }));
      bumpStreakIfResolved(guesserId, subjectId);
    },

    toggleFavorite: (friendId, groupId, questionId) => {
      const ownerId = get().activeUserId;
      const id = `${ownerId}:${friendId}:${groupId}:${questionId}`;
      const likedAt = getEffectiveNow(get()).toISOString();
      set((state) => {
        const exists = state.favorites.some((f) => f.id === id);
        return {
          favorites: exists
            ? state.favorites.filter((f) => f.id !== id)
            : [...state.favorites, { id, ownerId, friendId, groupId, questionId, likedAt }],
        };
      });
    },

    syncRealUser: (profile) => {
      set((state) => ({
        users: { ...state.users, [profile.id]: profile },
        activeUserId: profile.id,
      }));
    },

    mergeRealFriend: (profile) => {
      set((state) => ({ users: { ...state.users, [profile.id]: profile } }));
    },

    removeFriendFromUsers: (friendId) => {
      set((state) => {
        const users = { ...state.users };
        delete users[friendId];
        return { users };
      });
    },
  };
});

export function myGuessStatus(state: AppState, friendId: string, groupId: string): ResolutionStatus {
  const guess = state.guesses[state.activeUserId]?.[friendId]?.[groupId];
  const truth = latestAnswers(state.history[friendId]?.[groupId]);
  return statusOf(guess, truth);
}

export function theirGuessStatus(state: AppState, friendId: string, groupId: string): ResolutionStatus {
  const guess = state.guesses[friendId]?.[state.activeUserId]?.[groupId];
  const truth = latestAnswers(state.history[state.activeUserId]?.[groupId]);
  return statusOf(guess, truth);
}

export function hasHourglassForGroup(state: AppState, friendId: string, groupId: string): boolean {
  return (
    myGuessStatus(state, friendId, groupId) === 'waiting_for_truth' ||
    theirGuessStatus(state, friendId, groupId) === 'waiting_for_truth'
  );
}

export function hasHourglassForFriend(state: AppState, friendId: string): boolean {
  return state.groups.some((group) => hasHourglassForGroup(state, friendId, group.id));
}

/** How many of my groups friends are waiting on me to answer, across everyone. */
export function waitingForMeCount(state: AppState): number {
  let count = 0;
  for (const otherId of Object.keys(state.users)) {
    if (otherId === state.activeUserId) continue;
    for (const group of state.groups) {
      if (theirGuessStatus(state, otherId, group.id) === 'waiting_for_truth') count++;
    }
  }
  return count;
}

export function streakWith(state: AppState, friendId: string): number {
  return state.streaks[pairKey(state.activeUserId, friendId)] ?? 0;
}

export interface MatchResult {
  matches: number;
  total: number;
  percent: number | null;
}

/** % of directly-comparable questions where my latest answer equals the friend's, across all groups. */
export function matchWithFriend(state: AppState, friendId: string): MatchResult {
  let matches = 0;
  let total = 0;
  for (const group of state.groups) {
    const mine = latestAnswers(state.history[state.activeUserId]?.[group.id]);
    const theirs = latestAnswers(state.history[friendId]?.[group.id]);
    if (!mine || !theirs) continue;
    for (const question of group.questions) {
      total += 1;
      if (mine[question.id] === theirs[question.id]) matches += 1;
    }
  }
  return { matches, total, percent: total > 0 ? Math.round((matches / total) * 100) : null };
}

/** Every question where my latest answer and the friend's latest answer agree, optionally limited to one category. */
export function sharedAnswers(state: AppState, friendId: string, categoryId?: string) {
  const shared: { group: QuestionGroup; questionId: string; value: AnswerMap[string] }[] = [];
  for (const group of state.groups) {
    if (categoryId && group.category !== categoryId) continue;
    const mine = latestAnswers(state.history[state.activeUserId]?.[group.id]);
    const theirs = latestAnswers(state.history[friendId]?.[group.id]);
    if (!mine || !theirs) continue;
    for (const question of group.questions) {
      if (mine[question.id] !== undefined && mine[question.id] === theirs[question.id]) {
        shared.push({ group, questionId: question.id, value: mine[question.id] });
      }
    }
  }
  return shared;
}

export interface CategoryMatchResult extends MatchResult {
  category: Category;
}

/** % overlap per umbrella category, so Match can show "Politik 70%, Kunst 10%, ..." before drilling into questions. */
export function matchByCategory(state: AppState, friendId: string): CategoryMatchResult[] {
  return CATEGORIES.map((category) => {
    let matches = 0;
    let total = 0;
    for (const group of state.groups) {
      if (group.category !== category.id) continue;
      const mine = latestAnswers(state.history[state.activeUserId]?.[group.id]);
      const theirs = latestAnswers(state.history[friendId]?.[group.id]);
      if (!mine || !theirs) continue;
      for (const question of group.questions) {
        total += 1;
        if (mine[question.id] === theirs[question.id]) matches += 1;
      }
    }
    return { category, matches, total, percent: total > 0 ? Math.round((matches / total) * 100) : null };
  });
}

/** How many of my own groups I've completed at least once. */
export function answeredGroupCount(state: AppState): number {
  return state.groups.filter((group) => Boolean(latestAnswers(state.history[state.activeUserId]?.[group.id])))
    .length;
}

/** Total guesses friends have made about me, across all groups (resolved or still pending). */
export function totalGuessesCollected(state: AppState): number {
  let count = 0;
  for (const guesserId of Object.keys(state.guesses)) {
    const bySubject = state.guesses[guesserId]?.[state.activeUserId];
    if (bySubject) count += Object.keys(bySubject).length;
  }
  return count;
}
