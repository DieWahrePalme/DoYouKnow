import { HistoryMap } from '@/types';
import { addDays, berlinDayKey } from '@/utils/berlinDay';

/**
 * Streaks are derived, never stored: both friends' devices compute the same
 * number from the same answers + guess_days rows, so there's nothing to
 * race on, double-count, or wrongly reset from a device that missed an
 * update (all three happened with the old stored counter).
 *
 * Rule (docs/PRD.md, "Streak"): a day counts for a pair only when all four
 * are done - A answered A's card, B answered B's, A guessed B's card that
 * day, B guessed A's. The streak is the run of such days ending yesterday,
 * plus today once today is complete too - so a flame survives until
 * midnight and goes out the moment a day is missed.
 *
 * Past days are checked against the card that was actually guessed (stored
 * in guess_days), not a re-drawn one - so adding question groups later,
 * which reshuffles future draws (src/utils/dailyCard.ts), can't break
 * streaks retroactively.
 */

/** Stops the backwards walk - nobody has a streak older than the app. */
const MAX_STREAK_DAYS = 3 * 366;

/** One guess_days row: which card was guessed, and when (first guess that day, ISO timestamp). */
export interface GuessDay {
  groupId: string;
  at: string;
}

/** Key for one guess_days row: `guesser` guessed `subject`'s card on `dayKey`. */
export function guessDayKey(guesserId: string, subjectId: string, dayKey: string): string {
  return `${guesserId}|${subjectId}|${dayKey}`;
}

export interface StreakData {
  /** subjectId -> groupId -> HistoryMap (answers are append-only, each with its timestamp). */
  history: Record<string, Record<string, HistoryMap>>;
  guessDays: Record<string, GuessDay>;
}

/** Did `userId` have card `groupId` answered by the end of `dayKey`? Answering ahead counts (PRD). */
function answeredBy(data: StreakData, userId: string, groupId: string, dayKey: string): boolean {
  const byQuestion = data.history[userId]?.[groupId];
  if (!byQuestion) return false;
  return Object.values(byQuestion).some((entries) => entries.some((entry) => berlinDayKey(new Date(entry.at)) <= dayKey));
}

export function isDayComplete(data: StreakData, userAId: string, userBId: string, dayKey: string): boolean {
  // A guessed B's card that day, and B guessed A's - each row names the card.
  const cardOfB = data.guessDays[guessDayKey(userAId, userBId, dayKey)]?.groupId;
  const cardOfA = data.guessDays[guessDayKey(userBId, userAId, dayKey)]?.groupId;
  if (!cardOfA || !cardOfB) return false;
  // ...and both had their own card answered by the end of that day.
  return answeredBy(data, userAId, cardOfA, dayKey) && answeredBy(data, userBId, cardOfB, dayKey);
}

export function computeStreak(data: StreakData, userAId: string, userBId: string, today: string): number {
  let streak = isDayComplete(data, userAId, userBId, today) ? 1 : 0;
  let day = addDays(today, -1);
  for (let i = 0; i < MAX_STREAK_DAYS && isDayComplete(data, userAId, userBId, day); i++) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
