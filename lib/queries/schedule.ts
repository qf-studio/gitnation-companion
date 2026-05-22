import type { Schedule, Session } from '@/lib/data/schema';

export interface DayGroup {
  /** ISO date (`YYYY-MM-DD`) in UTC, or `'TBA'` for undated sessions. */
  dayKey: string;
  sessions: Session[];
}

const TBA = 'TBA';

/** Extract `YYYY-MM-DD` from an ISO datetime string by taking the UTC date portion. */
function utcDayKey(iso: string): string {
  // Use Date to normalize to UTC — handles trailing `Z` and `+hh:mm` offsets uniformly.
  const d = new Date(iso);
  const y = d.getUTCFullYear().toString().padStart(4, '0');
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Group sessions into day buckets. Days are ordered chronologically; undated
 * sessions are collected into a single `'TBA'` bucket placed last. Within a
 * day, sessions are sorted by `startsAt` ascending.
 */
export function groupByDay(schedule: Schedule): DayGroup[] {
  const buckets = new Map<string, Session[]>();

  for (const s of schedule.sessions) {
    const key = s.startsAt === null ? TBA : utcDayKey(s.startsAt);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(s);
    else buckets.set(key, [s]);
  }

  const dated: DayGroup[] = [];
  let tba: DayGroup | undefined;

  for (const [dayKey, sessions] of buckets) {
    if (dayKey === TBA) {
      tba = { dayKey, sessions };
    } else {
      dated.push({
        dayKey,
        sessions: [...sessions].sort((a, b) => {
          // Both have non-null startsAt by construction.
          return (a.startsAt ?? '').localeCompare(b.startsAt ?? '');
        }),
      });
    }
  }

  dated.sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  return tba ? [...dated, tba] : dated;
}
