import { create } from 'zustand';

import { CATEGORIES, INITIAL_GUESSES, INITIAL_HISTORY, QUESTION_GROUPS } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { AnswerMap, AnswerValue, Category, FavoriteItem, HistoryMap, QuestionGroup, UserProfile } from '@/types';
import { berlinDayKey, msUntilNextBerlinDay } from '@/utils/berlinDay';
import { groupIdForDay } from '@/utils/dailyCard';
import { computeStreak, GuessDay, guessDayKey } from '@/utils/streak';

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
  /**
   * guessDayKey(guesser, subject, day) -> card + time: an append-only log of
   * which friend's card someone guessed on which Berlin day. `guesses`
   * above is overwritten per group, so it can't say *when* - this can, and
   * streaks are computed from it (see src/utils/streak.ts).
   */
  guessDays: Record<string, GuessDay>;
  favorites: FavoriteItem[];
  /** The current Berlin day ('YYYY-MM-DD') - streaks are computed relative to it. */
  today: string;
  updateProfileName: (name: string) => void;
  updateProfileAvatar: (avatarEmoji: string) => void;
  submitSelfAnswers: (subjectId: string, groupId: string, answers: AnswerMap) => void;
  submitGuess: (subjectId: string, groupId: string, answers: AnswerMap) => void;
  toggleFavorite: (friendId: string, groupId: string, questionId: string) => void;
  /**
   * Test helper: deletes my answers to today's card (all of them, so the
   * card is open again) and every guess I made today, locally and in
   * Supabase - so a round with friends can be replayed. Resolves with a
   * user-facing error message, or null on success.
   */
  resetToday: () => Promise<string | null>;
  /** Moves `today` forward once the Berlin day changes. Cheap - safe to call every second. */
  checkDayRollover: () => void;
  /** Records today's card for the signed-in user in Supabase (daily_cards) - the 22:00 streak reminder needs it. Idempotent. */
  recordTodaysCard: () => void;
  /** Makes the real signed-in account "you" in the app - called once after login/signup. */
  syncRealUser: (profile: UserProfile) => void;
  /** Adds a real accepted friend's profile to the roster so every screen that reads `users` picks them up. */
  mergeRealFriend: (profile: UserProfile) => void;
  /** Drops a friend from the local roster - called after the backing friendship row (if any) is deleted. */
  removeFriendFromUsers: (friendId: string) => void;
  /**
   * Pulls answers/guesses/guess days involving the active user and everyone
   * currently in `users` from Supabase into local state - without this,
   * a page reload wiped everything back to empty because those maps only
   * ever lived in memory. Safe to call repeatedly (e.g. whenever the
   * friend list changes); it always replaces with the latest server state.
   */
  loadCloudData: () => Promise<void>;
  /**
   * Clears everything tied to the signed-in identity - users, history,
   * guesses, guess days, favorites. Call this on sign-out; without it, signing
   * out and signing into a *different* account in the same browser tab left
   * the previous account's profile sitting in `users`, where it showed up
   * as a phantom "friend" for whoever signed in next.
   */
  resetForSignOut: () => void;
}

/** Time left in the current day - days end at midnight Europe/Berlin for everyone (docs/PRD.md). */
export function msUntilNextDay(now: Date): number {
  return msUntilNextBerlinDay(now);
}

/** Deterministic per-person daily pick - different people get different groups, rotating at Berlin midnight. */
export function getTodaysGroupIdFor(subjectId: string, groups: QuestionGroup[], now: Date): string {
  return groupIdForDay(subjectId, groups, berlinDayKey(now));
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
  return {
    users: {},
    activeUserId: '',
    groups: QUESTION_GROUPS,
    history: INITIAL_HISTORY,
    guesses: INITIAL_GUESSES,
    guessDays: {},
    favorites: [],
    today: berlinDayKey(new Date()),

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

    checkDayRollover: () => {
      const today = berlinDayKey(new Date());
      if (today !== get().today) set({ today });
    },

    recordTodaysCard: () => {
      const { activeUserId: me, today, groups } = get();
      if (!me || !isSupabaseConfigured) return;
      void supabase
        .from('daily_cards')
        .upsert(
          { user_id: me, day: today, group_id: getTodaysGroupIdFor(me, groups, new Date()) },
          { onConflict: 'user_id,day', ignoreDuplicates: true },
        )
        .then(({ error }) => logSupabaseError('daily_cards insert', error));
    },

    resetToday: async () => {
      const { activeUserId: me, today, groups, guessDays } = get();
      if (!me) return null;
      const myCardId = getTodaysGroupIdFor(me, groups, new Date());
      const myGuessesToday = Object.entries(guessDays)
        .map(([key, entry]) => ({ key, parts: key.split('|'), groupId: entry.groupId }))
        .filter(({ parts }) => parts[0] === me && parts[2] === today)
        .map(({ key, parts, groupId }) => ({ key, subjectId: parts[1], groupId }));

      if (isSupabaseConfigured) {
        const results = await Promise.all([
          supabase.from('answers').delete().eq('user_id', me).eq('group_id', myCardId).select('id'),
          ...myGuessesToday.map(({ subjectId, groupId }) =>
            supabase.from('guesses').delete().eq('guesser_id', me).eq('subject_id', subjectId).eq('group_id', groupId),
          ),
          supabase.from('guess_days').delete().eq('guesser_id', me).eq('day', today),
        ]);
        const failed = results.find((result) => result.error);
        if (failed?.error) {
          logSupabaseError('reset today', failed.error);
          return `Zurücksetzen fehlgeschlagen: ${failed.error.message}`;
        }
        // RLS silently skips rows it doesn't allow deleting - no error, just
        // nothing deleted. Without the delete policies in schema.sql that's
        // what happens, so check the answers actually went away.
        const hadAnswers = Boolean(get().history[me]?.[myCardId]);
        if (hadAnswers && (results[0].data ?? []).length === 0) {
          return 'Nichts gelöscht - fehlen die Lösch-Regeln in Supabase? (supabase/schema.sql erneut ausführen)';
        }
      }

      set((state) => {
        const myHistory = { ...(state.history[me] ?? {}) };
        delete myHistory[myCardId];
        const myGuesses = { ...(state.guesses[me] ?? {}) };
        const nextGuessDays = { ...state.guessDays };
        for (const { key, subjectId, groupId } of myGuessesToday) {
          const bySubject = { ...(myGuesses[subjectId] ?? {}) };
          delete bySubject[groupId];
          myGuesses[subjectId] = bySubject;
          delete nextGuessDays[key];
        }
        return {
          history: { ...state.history, [me]: myHistory },
          guesses: { ...state.guesses, [me]: myGuesses },
          guessDays: nextGuessDays,
        };
      });
      return null;
    },

    submitSelfAnswers: (subjectId, groupId, answers) => {
      const at = new Date().toISOString();
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
        const at = new Date().toISOString();
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

      // Logged per Berlin day (append-only) so the streak can tell *which*
      // day a friend's card was guessed - see src/utils/streak.ts.
      // First guess of the day wins (matches the insert's ignoreDuplicates).
      const guessedAt = new Date();
      const day = berlinDayKey(guessedAt);
      const dayKeyForPair = guessDayKey(guesserId, subjectId, day);
      if (!get().guessDays[dayKeyForPair]) {
        set((state) => ({
          guessDays: { ...state.guessDays, [dayKeyForPair]: { groupId, at: guessedAt.toISOString() } },
        }));
      }
      if (isSupabaseConfigured) {
        void supabase
          .from('guess_days')
          .upsert(
            { guesser_id: guesserId, subject_id: subjectId, day, group_id: groupId, created_at: guessedAt.toISOString() },
            { onConflict: 'guesser_id,subject_id,day', ignoreDuplicates: true },
          )
          .then(({ error }) => logSupabaseError('guess_days insert', error));
      }
    },

    toggleFavorite: (friendId, groupId, questionId) => {
      const ownerId = get().activeUserId;
      const id = `${ownerId}:${friendId}:${groupId}:${questionId}`;
      const likedAt = new Date().toISOString();
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

      const [answersRes, guessesRes, guessDaysRes] = await Promise.all([
        supabase
          .from('answers')
          .select('user_id, group_id, question_id, value, answered_at')
          .in('user_id', relevantIds),
        supabase
          .from('guesses')
          .select('guesser_id, subject_id, group_id, question_id, value')
          .or(`guesser_id.eq.${myId},subject_id.eq.${myId}`),
        supabase
          .from('guess_days')
          .select('guesser_id, subject_id, day, group_id, created_at')
          .or(`guesser_id.eq.${myId},subject_id.eq.${myId}`),
      ]);
      logSupabaseError('answers load', answersRes.error);
      logSupabaseError('guesses load', guessesRes.error);
      logSupabaseError('guess_days load', guessDaysRes.error);

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

      const cloudGuessDays: Record<string, GuessDay> = {};
      for (const row of guessDaysRes.data ?? []) {
        cloudGuessDays[guessDayKey(row.guesser_id, row.subject_id, row.day)] = { groupId: row.group_id, at: row.created_at };
      }

      set((s) => {
        const history = { ...s.history, ...cloudHistory };
        const guesses = { ...s.guesses };
        for (const [guesserId, bySubject] of Object.entries(cloudGuesses)) {
          guesses[guesserId] = { ...(guesses[guesserId] ?? {}), ...bySubject };
        }
        return { history, guesses, guessDays: { ...s.guessDays, ...cloudGuessDays } };
      });
    },

    resetForSignOut: () => {
      set({
        users: {},
        activeUserId: '',
        history: {},
        guesses: {},
        guessDays: {},
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

/** Current flame count with a friend - derived from answers + guess days, never stored (see src/utils/streak.ts). */
export function streakWith(state: AppState, friendId: string): number {
  return computeStreak(state, state.activeUserId, friendId, state.today);
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
