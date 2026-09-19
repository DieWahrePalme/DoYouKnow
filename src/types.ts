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

export interface DailyDeck {
  id: string;
  theme: string;
  questions: Question[];
}

/** `me` is the special subject id representing the app's current user. */
export const ME_ID = 'me';

export interface Friend {
  id: string;
  name: string;
  avatarEmoji: string;
  streak: number;
}

export type AnswerMap = Record<string, AnswerValue>;
