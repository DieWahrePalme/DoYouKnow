import { create } from 'zustand';

import {
  DECKS_BY_SUBJECT,
  FRIENDS,
  INITIAL_GUESSES_ABOUT_ME,
  INITIAL_SELF_ANSWERS,
} from '@/data/mockData';
import { AnswerMap, DailyDeck, Friend, ME_ID } from '@/types';

export type ResolutionStatus = 'not_guessed' | 'waiting_for_truth' | 'resolved';

interface AppState {
  friends: Friend[];
  decksBySubject: Record<string, DailyDeck>;
  /** Answers a subject gave about themselves ("the truth"), keyed by subject id. */
  selfAnswers: Record<string, AnswerMap>;
  /** Answers I guessed about a friend, keyed by friend id. */
  myGuesses: Record<string, AnswerMap>;
  /** Answers a friend guessed about me, keyed by friend id. */
  guessesAboutMe: Record<string, AnswerMap>;
  streakBumpedToday: Record<string, boolean>;
  submitSelfAnswers: (subjectId: string, answers: AnswerMap) => void;
  submitGuess: (friendId: string, answers: AnswerMap) => void;
}

function statusOf(guess: AnswerMap | undefined, truth: AnswerMap | undefined): ResolutionStatus {
  if (!guess) return 'not_guessed';
  return truth ? 'resolved' : 'waiting_for_truth';
}

export const useAppStore = create<AppState>((set, get) => {
  function bumpStreakIfResolved(friendId: string) {
    const state = get();
    if (state.streakBumpedToday[friendId]) return;

    const myGuessResolved = statusOf(state.myGuesses[friendId], state.selfAnswers[friendId]) === 'resolved';
    const theirGuessResolved =
      statusOf(state.guessesAboutMe[friendId], state.selfAnswers[ME_ID]) === 'resolved';

    if (myGuessResolved || theirGuessResolved) {
      set((s) => ({
        friends: s.friends.map((f) => (f.id === friendId ? { ...f, streak: f.streak + 1 } : f)),
        streakBumpedToday: { ...s.streakBumpedToday, [friendId]: true },
      }));
    }
  }

  return {
    friends: FRIENDS,
    decksBySubject: DECKS_BY_SUBJECT,
    selfAnswers: { ...INITIAL_SELF_ANSWERS },
    myGuesses: {},
    guessesAboutMe: { ...INITIAL_GUESSES_ABOUT_ME },
    streakBumpedToday: {},

    submitSelfAnswers: (subjectId, answers) => {
      set((state) => ({ selfAnswers: { ...state.selfAnswers, [subjectId]: answers } }));
      if (subjectId === ME_ID) {
        get().friends.forEach((friend) => bumpStreakIfResolved(friend.id));
      } else {
        bumpStreakIfResolved(subjectId);
      }
    },

    submitGuess: (friendId, answers) => {
      set((state) => ({ myGuesses: { ...state.myGuesses, [friendId]: answers } }));
      bumpStreakIfResolved(friendId);
    },
  };
});

export function myGuessStatus(state: AppState, friendId: string): ResolutionStatus {
  return statusOf(state.myGuesses[friendId], state.selfAnswers[friendId]);
}

export function theirGuessStatus(state: AppState, friendId: string): ResolutionStatus {
  return statusOf(state.guessesAboutMe[friendId], state.selfAnswers[ME_ID]);
}

export function hasHourglass(state: AppState, friendId: string): boolean {
  return (
    myGuessStatus(state, friendId) === 'waiting_for_truth' ||
    theirGuessStatus(state, friendId) === 'waiting_for_truth'
  );
}
