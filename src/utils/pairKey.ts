/** Canonical, order-independent key for something that belongs to a pair of people (e.g. a streak). */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}
