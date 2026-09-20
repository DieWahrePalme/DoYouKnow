import { create } from 'zustand';

import {
  DEFAULT_PROFILE,
  FRIENDS,
  INITIAL_GUESSES_ABOUT_ME,
  INITIAL_HISTORY,
  QUESTION_GROUPS,
} from '@/data/mockData';
import { AnswerMap, FavoriteItem, Friend, HistoryMap, ME_ID, Profile, QuestionGroup } from '@/types';

export type ResolutionStatus = 'not_guessed' | 'waiting_for_truth' | 'resolved';

interface AppState {
  profile: Profile;
  friends: Friend[];
  groups: QuestionGroup[];
  /** subjectId -> groupId -> HistoryMap. Missing group = never answered. */
  history: Record<string, Record<string, HistoryMap>>;
  /** friendId -> groupId -> my guess about that friend. */
  myGuesses: Record<string, Record<string, AnswerMap>>;
  /** friendId -> groupId -> that friend's guess about me. */
  guessesAboutMe: Record<string, Record<string, AnswerMap>>;
  streakBumpedToday: Record<string, boolean>;
  favorites: FavoriteItem[];
  updateProfileName: (name: string) => void;
  updateProfileAvatar: (avatarEmoji: string) => void;
  submitSelfAnswers: (subjectId: string, groupId: string, answers: AnswerMap) => void;
  submitGuess: (friendId: string, groupId: string, answers: AnswerMap) => void;
  toggleFavorite: (friendId: string, groupId: string, questionId: string) => void;
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
  function bumpStreakIfResolved(friendId: string) {
    const state = get();
    if (state.streakBumpedToday[friendId]) return;

    const anyResolved = state.groups.some(
      (group) =>
        myGuessStatus(state, friendId, group.id) === 'resolved' ||
        theirGuessStatus(state, friendId, group.id) === 'resolved',
    );

    if (anyResolved) {
      set((s) => ({
        friends: s.friends.map((f) => (f.id === friendId ? { ...f, streak: f.streak + 1 } : f)),
        streakBumpedToday: { ...s.streakBumpedToday, [friendId]: true },
      }));
    }
  }

  return {
    profile: DEFAULT_PROFILE,
    friends: FRIENDS,
    groups: QUESTION_GROUPS,
    history: INITIAL_HISTORY,
    myGuesses: {},
    guessesAboutMe: INITIAL_GUESSES_ABOUT_ME,
    streakBumpedToday: {},
    favorites: [],

    updateProfileName: (name) => set((state) => ({ profile: { ...state.profile, name } })),
    updateProfileAvatar: (avatarEmoji) => set((state) => ({ profile: { ...state.profile, avatarEmoji } })),

    submitSelfAnswers: (subjectId, groupId, answers) => {
      const at = new Date().toISOString();
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

      if (subjectId === ME_ID) {
        get().friends.forEach((friend) => bumpStreakIfResolved(friend.id));
      } else {
        bumpStreakIfResolved(subjectId);
      }
    },

    submitGuess: (friendId, groupId, answers) => {
      set((state) => ({
        myGuesses: {
          ...state.myGuesses,
          [friendId]: { ...(state.myGuesses[friendId] ?? {}), [groupId]: answers },
        },
      }));
      bumpStreakIfResolved(friendId);
    },

    toggleFavorite: (friendId, groupId, questionId) => {
      const id = `${friendId}:${groupId}:${questionId}`;
      set((state) => {
        const exists = state.favorites.some((f) => f.id === id);
        return {
          favorites: exists
            ? state.favorites.filter((f) => f.id !== id)
            : [...state.favorites, { id, friendId, groupId, questionId, likedAt: new Date().toISOString() }],
        };
      });
    },
  };
});

export function myGuessStatus(state: AppState, friendId: string, groupId: string): ResolutionStatus {
  const guess = state.myGuesses[friendId]?.[groupId];
  const truth = latestAnswers(state.history[friendId]?.[groupId]);
  return statusOf(guess, truth);
}

export function theirGuessStatus(state: AppState, friendId: string, groupId: string): ResolutionStatus {
  const guess = state.guessesAboutMe[friendId]?.[groupId];
  const truth = latestAnswers(state.history[ME_ID]?.[groupId]);
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

/** How many of MY groups friends are waiting on me to answer, across all friends. */
export function waitingForMeCount(state: AppState): number {
  let count = 0;
  for (const friend of state.friends) {
    for (const group of state.groups) {
      if (theirGuessStatus(state, friend.id, group.id) === 'waiting_for_truth') count++;
    }
  }
  return count;
}

/** Deterministic daily pick among the groups - same for everyone on a given day, changes overnight. */
export function getTodaysGroupId(groups: QuestionGroup[]): string {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86_400_000);
  return groups[dayOfYear % groups.length].id;
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
    const mine = latestAnswers(state.history[ME_ID]?.[group.id]);
    const theirs = latestAnswers(state.history[friendId]?.[group.id]);
    if (!mine || !theirs) continue;
    for (const question of group.questions) {
      total += 1;
      if (mine[question.id] === theirs[question.id]) matches += 1;
    }
  }
  return { matches, total, percent: total > 0 ? Math.round((matches / total) * 100) : null };
}

/** Every question where my latest answer and the friend's latest answer agree. */
export function sharedAnswers(state: AppState, friendId: string) {
  const shared: { group: QuestionGroup; questionId: string; value: AnswerMap[string] }[] = [];
  for (const group of state.groups) {
    const mine = latestAnswers(state.history[ME_ID]?.[group.id]);
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

/** How many of my own groups I've completed at least once. */
export function answeredGroupCount(state: AppState): number {
  return state.groups.filter((group) => Boolean(latestAnswers(state.history[ME_ID]?.[group.id]))).length;
}

/** Total guesses friends have made about me, across all groups (resolved or still pending). */
export function totalGuessesCollected(state: AppState): number {
  return Object.values(state.guessesAboutMe).reduce((sum, byGroup) => sum + Object.keys(byGroup).length, 0);
}
