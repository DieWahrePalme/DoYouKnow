/**
 * `never` ("Nie") is a stronger, deliberate extreme reached via a double-tap
 * on the card's center - distinct from the regular "no" swipe. The other
 * four are the ordinary agreement scale reached by swiping.
 */
export type AnswerValue = 'never' | 'no' | 'leanNo' | 'leanYes' | 'yes';

export const ANSWER_LABELS: Record<AnswerValue, string> = {
  never: 'Nie',
  no: 'Nein',
  leanNo: 'Eher nein',
  leanYes: 'Eher ja',
  yes: 'Ja',
};

export interface Question {
  id: string;
  text: string;
}

/**
 * A fixed topic in the shared catalog every person (you + every friend)
 * answers into independently, e.g. "Sport" or "Familie". Unlike the old
 * daily deck, a group is not tied to a specific day - it can be answered or
 * updated at any time, and every past answer is kept (see `AnswerEntry`).
 */
export interface QuestionGroup {
  id: string;
  name: string;
  icon: string;
  questions: Question[];
}

/** One timestamped answer. A question accumulates these over time instead of being overwritten. */
export interface AnswerEntry {
  value: AnswerValue;
  at: string; // ISO date
}

export type AnswerMap = Record<string, AnswerValue>;
/** Full answer history for one group: questionId -> chronological list of entries (oldest first). */
export type HistoryMap = Record<string, AnswerEntry[]>;

/** Anyone in the app: a switchable test identity or a friend/NPC. */
export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
}

/** A user as shown in a list, with the streak between them and whoever is currently active. */
export interface Friend {
  id: string;
  name: string;
  avatarEmoji: string;
  streak: number;
}

/** A shared-answer question you liked, to actually do together next time you meet. */
export interface FavoriteItem {
  id: string;
  /** Who liked it - the active user at the time, since favorites are per-person. */
  ownerId: string;
  friendId: string;
  groupId: string;
  questionId: string;
  likedAt: string;
}
