export function formatRelative(iso: string, now: Date = new Date()): string {
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 30) return `vor ${days} Tagen`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? 'vor 1 Monat' : `vor ${months} Monaten`;
  const years = Math.round(months / 12);
  return years === 1 ? 'vor 1 Jahr' : `vor ${years} Jahren`;
}
