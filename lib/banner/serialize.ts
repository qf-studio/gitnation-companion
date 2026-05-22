import type { Schedule } from '@/lib/data/schema';
import type { MinimalSession } from './state';

/**
 * Project a full Schedule down to the minimal fields the banner client island
 * needs. Reduces serialized RSC payload (no abstractHtml, no speakers, no tags
 * shipped to the client just to know which session is currently live).
 */
export function toMinimalSessions(schedule: Schedule): MinimalSession[] {
  return schedule.sessions.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
  }));
}
