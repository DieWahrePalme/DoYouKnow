export type AnswerValue = 'no' | 'leanNo' | 'leanYes' | 'yes';

export const ANSWER_LABELS: Record<AnswerValue, string> = {
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

export interface Profile {
  name: string;
  avatarEmoji: string;
}

/** `me` is the special subject id representing the app's current user. */
export const ME_ID = 'me';

export interface Friend {
  id: string;
  name: string;
  avatarEmoji: string;
  streak: number;
}
