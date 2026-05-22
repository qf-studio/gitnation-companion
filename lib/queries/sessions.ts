import type { Schedule, Session } from '@/lib/data/schema';

/**
 * Find a session by its slug. Returns `undefined` if not found.
 */
export function getSessionBySlug(schedule: Schedule, slug: string): Session | undefined {
  return schedule.sessions.find((s) => s.slug === slug);
}

export interface ListSessionsOptions {
  /** When `true`, only sessions with a non-null `startsAt`. When `false`, only undated. */
  dated?: boolean;
  /** When set, restrict to a specific kind. */
  kind?: 'workshop' | 'talk';
}

/**
 * List sessions, optionally filtered by `dated` and/or `kind`. Pure — does not
 * mutate the input. Order is the input order; sorting is the caller's concern
 * (see `groupByDay` for chronological grouping).
 */
export function listSessions(schedule: Schedule, opts: ListSessionsOptions = {}): Session[] {
  return schedule.sessions.filter((s) => {
    if (opts.kind !== undefined && s.kind !== opts.kind) return false;
    if (opts.dated === true && s.startsAt === null) return false;
    if (opts.dated === false && s.startsAt !== null) return false;
    return true;
  });
}
