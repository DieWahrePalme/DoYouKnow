import { QuestionGroup } from '@/types';
import { addDays } from '@/utils/berlinDay';

/**
 * Which topic card someone gets on a given Berlin day.
 *
 * Random, but with memory: yesterday's card can't come back, and the longer
 * a card hasn't been drawn, the likelier it gets - weight = (days since it
 * was last drawn - 1)^2, capped, with never-drawn cards at the cap. No fixed
 * order, so it still feels random.
 *
 * Every device has to agree on everyone's card, so the "randomness" is
 * seeded from (person, day) and the draw history is replayed day by day
 * from EPOCH_DAY. Results are cached per person, so each day is only drawn
 * once per app session.
 */
const EPOCH_DAY = '2026-09-01';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Deterministic value in [0, 1) for a seed (mulberry32 finalizer - spreads similar seeds apart). */
function seededUnit(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function drawIndex(subjectId: string, dayKey: string, lastDrawnDayIndex: number[], dayIndex: number): number {
  const cap = lastDrawnDayIndex.length;
  const weights = lastDrawnDayIndex.map((last) => {
    const daysSince = last < 0 ? cap + 1 : Math.min(dayIndex - last, cap + 1);
    return (daysSince - 1) ** 2;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = seededUnit(hashString(`${subjectId}:${dayKey}`)) * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

interface DrawCache {
  /** groupIds[i] = card drawn on EPOCH_DAY + i. */
  groupIds: string[];
  /** Per group index: day index it was last drawn on, -1 = never. */
  lastDrawnDayIndex: number[];
}

const cacheByGroups = new WeakMap<QuestionGroup[], Map<string, DrawCache>>();

function daysBetween(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split('-').map(Number);
  const [ty, tm, td] = toDay.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function groupIdForDay(subjectId: string, groups: QuestionGroup[], dayKey: string): string {
  const dayIndex = daysBetween(EPOCH_DAY, dayKey);
  // Before the epoch there's no history to weigh against - a plain seeded pick.
  if (dayIndex < 0) return groups[Math.floor(seededUnit(hashString(`${subjectId}:${dayKey}`)) * groups.length)].id;

  let byPerson = cacheByGroups.get(groups);
  if (!byPerson) {
    byPerson = new Map();
    cacheByGroups.set(groups, byPerson);
  }
  let cache = byPerson.get(subjectId);
  if (!cache) {
    cache = { groupIds: [], lastDrawnDayIndex: groups.map(() => -1) };
    byPerson.set(subjectId, cache);
  }

  for (let i = cache.groupIds.length; i <= dayIndex; i++) {
    const index = drawIndex(subjectId, addDays(EPOCH_DAY, i), cache.lastDrawnDayIndex, i);
    cache.groupIds.push(groups[index].id);
    cache.lastDrawnDayIndex[index] = i;
  }
  return cache.groupIds[dayIndex];
}
