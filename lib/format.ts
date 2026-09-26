export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function initials(name: string): string {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export type RatingTone = 'legend' | 'great' | 'good' | 'mixed';

export function ratingTone(rating: number): RatingTone {
  if (rating >= 8.6) return 'legend';
  if (rating >= 7.8) return 'great';
  if (rating >= 6.8) return 'good';
  return 'mixed';
}

export function ratingLabel(rating: number): string {
  const tone = ratingTone(rating);
  if (tone === 'legend') return 'Masterpiece';
  if (tone === 'great') return 'Excellent';
  if (tone === 'good') return 'Worth it';
  return 'Mixed';
}

export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1));
}
