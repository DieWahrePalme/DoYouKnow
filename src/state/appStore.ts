import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CATEGORIES, INITIAL_GUESSES, INITIAL_HISTORY, INITIAL_STREAKS, QUESTION_GROUPS } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { AnswerMap, AnswerValue, Category, FavoriteItem, HistoryMap, QuestionGroup, UserProfile } from '@/types';
import { pairKey } from '@/utils/pairKey';

export type ResolutionStatus = 'not_guessed' | 'waiting_for_truth' | 'resolved';

interface AppState {
  /** Every known person: the signed-in real user plus their accepted real friends. */
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
   * waiting for real midnight. Shared across every signed-in account via
   * Supabase's `test_clock` table (see loadGlobalTimeOffset) - a real
   * production backend would never let clients move its clock like this.
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
  /** Drops the time jump and returns to real current time for everyone - clears the shared offset too. */
  resetTimeOffset: () => void;
  /** Instant local cache so the UI doesn't flash real time before loadGlobalTimeOffset resolves. Call once on app start. */
  hydrateTimeOffset: () => Promise<void>;
  /** Reads the shared test_clock row from Supabase - the actual source of truth for timeOffsetMs. Call on start and poll periodically so every account converges on the same jumped time. */
  loadGlobalTimeOffset: () => Promise<void>;
  checkDayRollover: () => void;
  /** Makes the real signed-in account "you" in the app - called once after login/signup. */
  syncRealUser: (profile: UserProfile) => void;
  /** Adds a real accepted friend's profile to the roster so every screen that reads `users` picks them up. */
  mergeRealFriend: (profile: UserProfile) => void;
  /** Drops a friend from the local roster - called after the backing friendship row (if any) is deleted. */
  removeFriendFromUsers: (friendId: string) => void;
  /**
   * Pulls answers/guesses/streaks involving the active user and everyone
   * currently in `users` from Supabase into local state - without this,
   * a page reload wiped everything back to empty because those maps only
   * ever lived in memory. Safe to call repeatedly (e.g. whenever the
   * friend list changes); it always replaces with the latest server state.
   */
  loadCloudData: () => Promise<void>;
  /**
   * Clears everything tied to the signed-in identity - users, history,
   * guesses, streaks, favorites. Call this on sign-out; without it, signing
   * out and signing into a *different* account in the same browser tab left
   * the previous account's profile sitting in `users`, where it showed up
   * as a phantom "friend" for whoever signed in next.
   */
  resetForSignOut: () => void;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The time-jump test controls (+1h / +1 day / now) are backed by a single
 * shared row in Supabase's `test_clock` table (see supabase/schema.sql) -
 * every signed-in account reads and can move the same offset, since the
 * daily group only rotates once per real day and testing streaks/rollovers
 * needs at least two accounts to see the same "day" move together.
 * AsyncStorage is only an instant-paint cache so the UI doesn't flash back
 * to real time for a moment before the Supabase row loads; Supabase is the
 * source of truth and always wins once it responds.
 */
const TIME_OFFSET_CACHE_KEY = 'dyk:timeOffsetMs';

function cacheTimeOffsetLocally(ms: number) {
  void AsyncStorage.setItem(TIME_OFFSET_CACHE_KEY, String(ms)).catch((err) =>
    console.error('[appStore] failed to cache time offset locally:', err),
  );
}

function pushGlobalTimeOffset(ms: number) {
  if (!isSupabaseConfigured) return;
  void supabase
    .from('test_clock')
    .update({ offset_ms: ms, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .then(({ error }) => logSupabaseError('test_clock update', error));
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

/**
 * Every write in this store used to be fire-and-forget (`void supabase...`),
 * so a failed insert/update (RLS rejection, network error, bad payload)
 * looked identical to a successful one until the next reload wiped the
 * "saved" data. Route every write through this so failures are at least
 * visible in the console instead of silently vanishing.
 */
function logSupabaseError(context: string, error: { message: string } | null) {
  if (error) console.error(`[supabase] ${context} failed:`, error.message);
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

  function pushStreak(userAId: string, userBId: string, streak: number, bumpedOn: string) {
    if (!isSupabaseConfigured) return;
    const [user_a, user_b] = [userAId, userBId].sort();
    void supabase
      .from('streaks')
      .upsert({ user_a, user_b, streak, bumped_on: bumpedOn }, { onConflict: 'user_a,user_b' })
      .then(({ error }) => logSupabaseError('streak upsert', error));
  }

  function bumpStreakIfResolved(userAId: string, userBId: string) {
    const state = get();
    const key = pairKey(userAId, userBId);
    if (state.streakBumpedToday[key]) return;

    const anyResolved = state.groups.some((group) => resolvedBetween(userAId, userBId, group.id));

    if (anyResolved) {
      const newStreak = (state.streaks[key] ?? 0) + 1;
      set((s) => ({
        streaks: { ...s.streaks, [key]: newStreak },
        streakBumpedToday: { ...s.streakBumpedToday, [key]: true },
      }));
      pushStreak(userAId, userBId, newStreak, dayKey(getEffectiveNow(state)));
    }
  }

  return {
    users: {},
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
      if (isSupabaseConfigured) {
        void supabase
          .from('profiles')
          .update({ username: name })
          .eq('id', userId)
          .then(({ error }) => logSupabaseError('profile name update', error));
      }
    },
    updateProfileAvatar: (avatarEmoji) => {
      set((state) => ({
        users: { ...state.users, [state.activeUserId]: { ...state.users[state.activeUserId], avatarEmoji } },
      }));
      const userId = get().activeUserId;
      if (isSupabaseConfigured) {
        void supabase
          .from('profiles')
          .update({ avatar_emoji: avatarEmoji })
          .eq('id', userId)
          .then(({ error }) => logSupabaseError('profile avatar update', error));
      }
    },

    advanceTimeBy: (ms) => {
      const next = get().timeOffsetMs + ms;
      set({ timeOffsetMs: next });
      cacheTimeOffsetLocally(next);
      pushGlobalTimeOffset(next);
      get().checkDayRollover();
    },

    jumpToNextDay: () => {
      const state = get();
      const delta = msUntilNextDay(getEffectiveNow(state)) + 1000;
      const next = state.timeOffsetMs + delta;
      set({ timeOffsetMs: next });
      cacheTimeOffsetLocally(next);
      pushGlobalTimeOffset(next);
      get().checkDayRollover();
    },

    resetTimeOffset: () => {
      // Re-anchor the day-rollover bookkeeping to the real current day too -
      // otherwise a jump forward (e.g. into tomorrow) leaves `lastProcessedDay`
      // ahead of real "today", and the very next tick would see "today" as
      // earlier than the last processed day and re-run rollover logic.
      set({ timeOffsetMs: 0, lastProcessedDay: dayKey(new Date()), streakBumpedToday: {} });
      cacheTimeOffsetLocally(0);
      pushGlobalTimeOffset(0);
    },

    hydrateTimeOffset: async () => {
      try {
        const cached = await AsyncStorage.getItem(TIME_OFFSET_CACHE_KEY);
        const ms = cached ? Number(cached) : 0;
        if (ms) {
          set({ timeOffsetMs: ms });
          get().checkDayRollover();
        }
      } catch (err) {
        console.error('[appStore] failed to read cached time offset:', err);
      }
    },

    loadGlobalTimeOffset: async () => {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase.from('test_clock').select('offset_ms').eq('id', 1).maybeSingle();
      logSupabaseError('test_clock load', error);
      if (!data) return;
      const ms = Number(data.offset_ms) || 0;
      if (ms !== get().timeOffsetMs) {
        set({ timeOffsetMs: ms });
        get().checkDayRollover();
      }
      cacheTimeOffsetLocally(ms);
    },

    checkDayRollover: () => {
      const state = get();
      const today = dayKey(getEffectiveNow(state));
      if (today === state.lastProcessedDay) return;
      // Nobody resolved anything for a pair during the day that just ended -> their flame goes out.
      set((s) => {
        const nextStreaks: Record<string, number> = {};
        for (const key of Object.keys(s.streaks)) {
          if (s.streakBumpedToday[key]) {
            nextStreaks[key] = s.streaks[key];
          } else {
            nextStreaks[key] = 0;
            if (s.streaks[key] > 0) {
              const [a, b] = key.split(':');
              pushStreak(a, b, 0, today);
            }
          }
        }
        return { streaks: nextStreaks, streakBumpedToday: {}, lastProcessedDay: today };
      });
    },

    submitSelfAnswers: (subjectId, groupId, answers) => {
      const at = getEffectiveNow(get()).toISOString();
      const groupQuestions = get().groups.find((g) => g.id === groupId)?.questions ?? [];
      set((state) => {
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

      if (isSupabaseConfigured && groupQuestions.length > 0) {
        void supabase
          .from('answers')
          .insert(
            groupQuestions.map((question) => ({
              user_id: subjectId,
              group_id: groupId,
              question_id: question.id,
              value: answers[question.id],
              answered_at: at,
            })),
          )
          .then(({ error }) => logSupabaseError('answers insert', error));
      }

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

      if (isSupabaseConfigured) {
        const at = getEffectiveNow(get()).toISOString();
        void supabase
          .from('guesses')
          .upsert(
            Object.entries(answers).map(([questionId, value]) => ({
              guesser_id: guesserId,
              subject_id: subjectId,
              group_id: groupId,
              question_id: questionId,
              value,
              updated_at: at,
            })),
            { onConflict: 'guesser_id,subject_id,group_id,question_id' },
          )
          .then(({ error }) => logSupabaseError('guesses upsert', error));
      }

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

    loadCloudData: async () => {
      if (!isSupabaseConfigured) return;
      const myId = get().activeUserId;
      if (!myId) return;
      const relevantIds = Array.from(new Set([myId, ...Object.keys(get().users).filter((id) => id !== myId)]));

      const [answersRes, guessesRes, streaksRes] = await Promise.all([
        supabase
          .from('answers')
          .select('user_id, group_id, question_id, value, answered_at')
          .in('user_id', relevantIds),
        supabase
          .from('guesses')
          .select('guesser_id, subject_id, group_id, question_id, value')
          .or(`guesser_id.eq.${myId},subject_id.eq.${myId}`),
        supabase.from('streaks').select('user_a, user_b, streak').or(`user_a.eq.${myId},user_b.eq.${myId}`),
      ]);
      logSupabaseError('answers load', answersRes.error);
      logSupabaseError('guesses load', guessesRes.error);
      logSupabaseError('streaks load', streaksRes.error);

      const cloudHistory: Record<string, Record<string, HistoryMap>> = {};
      for (const row of answersRes.data ?? []) {
        const bySubject = (cloudHistory[row.user_id] ??= {});
        const byGroup = (bySubject[row.group_id] ??= {});
        const entries = (byGroup[row.question_id] ??= []);
        entries.push({ value: row.value as AnswerValue, at: row.answered_at });
      }
      for (const bySubject of Object.values(cloudHistory)) {
        for (const byGroup of Object.values(bySubject)) {
          for (const entries of Object.values(byGroup)) {
            entries.sort((a, b) => a.at.localeCompare(b.at));
          }
        }
      }

      const cloudGuesses: Record<string, Record<string, Record<string, AnswerMap>>> = {};
      for (const row of guessesRes.data ?? []) {
        const bySubject = (cloudGuesses[row.guesser_id] ??= {});
        const byGroup = (bySubject[row.subject_id] ??= {});
        (byGroup[row.group_id] ??= {})[row.question_id] = row.value as AnswerValue;
      }

      const cloudStreaks: Record<string, number> = {};
      for (const row of streaksRes.data ?? []) {
        cloudStreaks[pairKey(row.user_a, row.user_b)] = row.streak;
      }

      set((s) => {
        const history = { ...s.history, ...cloudHistory };
        const guesses = { ...s.guesses };
        for (const [guesserId, bySubject] of Object.entries(cloudGuesses)) {
          guesses[guesserId] = { ...(guesses[guesserId] ?? {}), ...bySubject };
        }
        return { history, guesses, streaks: { ...s.streaks, ...cloudStreaks } };
      });
    },

    resetForSignOut: () => {
      set({
        users: {},
        activeUserId: '',
        history: {},
        guesses: {},
        streaks: {},
        streakBumpedToday: {},
        favorites: [],
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
