import { describe, expect, it } from 'vitest';
import fixture from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema } from '@/lib/data/schema';
import { getSessionBySlug, listSessions } from './sessions';

const schedule = ScheduleSchema.parse(fixture);

describe('getSessionBySlug', () => {
  it('returns the session for a known slug', () => {
    const session = getSessionBySlug(schedule, 'react-query-beyond-the-basics-3339');
    expect(session?.id).toBe(3339);
    expect(session?.title).toBe('React Query - Beyond the Basics');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getSessionBySlug(schedule, 'does-not-exist')).toBeUndefined();
  });
});

describe('listSessions', () => {
  it('returns all sessions when no options are passed', () => {
    expect(listSessions(schedule)).toHaveLength(schedule.sessions.length);
  });

  it('filters by dated=true and kind=workshop combined', () => {
    const result = listSessions(schedule, { dated: true, kind: 'workshop' });
    // Fixture has two dated workshops (React Query, Pear).
    expect(result.map((s) => s.id).sort()).toEqual([3339, 3693]);
    for (const s of result) {
      expect(s.kind).toBe('workshop');
      expect(s.startsAt).not.toBeNull();
    }
  });

  it('filters by dated=false to return only undated sessions', () => {
    const result = listSessions(schedule, { dated: false });
    expect(result.every((s) => s.startsAt === null)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
