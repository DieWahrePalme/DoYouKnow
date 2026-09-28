/**
 * Everyone plays on the same calendar: a day starts and ends at midnight
 * Europe/Berlin (docs/PRD.md, "Day boundary"), no matter where the device
 * is. Days are passed around as 'YYYY-MM-DD' keys in that zone.
 */
const TIME_ZONE = 'Europe/Berlin';
const DAY_MS = 24 * 60 * 60 * 1000;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function berlinWallClock(date: Date): WallClock {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The Berlin calendar day `date` falls on, as 'YYYY-MM-DD'. */
export function berlinDayKey(date: Date): string {
  const { year, month, day } = berlinWallClock(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Shifts a day key by whole calendar days (negative = earlier). */
export function addDays(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return shifted.toISOString().slice(0, 10);
}

/** Berlin's UTC offset in ms at `date` (+1h in winter, +2h in summer). */
function berlinOffsetMs(date: Date): number {
  const { year, month, day, hour, minute, second } = berlinWallClock(date);
  return Date.UTC(year, month - 1, day, hour, minute, second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Milliseconds until the next Berlin midnight - DST-safe (23h/25h days). */
export function msUntilNextBerlinDay(now: Date): number {
  const [year, month, day] = addDays(berlinDayKey(now), 1).split('-').map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  // Berlin switches DST at 02:00/03:00, never at midnight, so the offset a
  // few hours before midnight is the one in effect at midnight itself.
  const nextMidnight = midnightAsUtc - berlinOffsetMs(new Date(midnightAsUtc - DAY_MS / 2));
  return nextMidnight - now.getTime();
}
