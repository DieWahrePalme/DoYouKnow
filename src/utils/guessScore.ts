import { AnswerValue } from '@/types';

export type GuessOutcome = 'exact' | 'direction' | 'wrong';

/** Answers that lean the same way without being identical - worth half a point. */
const SAME_DIRECTION: Partial<Record<AnswerValue, AnswerValue>> = {
  yes: 'leanYes',
  leanYes: 'yes',
  no: 'leanNo',
  leanNo: 'no',
};

export const OUTCOME_POINTS: Record<GuessOutcome, number> = { exact: 1, direction: 0.5, wrong: 0 };

export const OUTCOME_ICONS: Record<GuessOutcome, string> = { exact: '✅', direction: '🌗', wrong: '❌' };

export function guessOutcome(guess: AnswerValue | undefined, truth: AnswerValue | undefined): GuessOutcome {
  if (guess === undefined || truth === undefined) return 'wrong';
  if (guess === truth) return 'exact';
  return SAME_DIRECTION[guess] === truth ? 'direction' : 'wrong';
}

/** 2.5 -> "2½", 3 -> "3" */
export function formatPoints(points: number): string {
  const whole = Math.floor(points);
  return points - whole >= 0.5 ? `${whole === 0 ? '' : whole}½` : String(whole);
}
