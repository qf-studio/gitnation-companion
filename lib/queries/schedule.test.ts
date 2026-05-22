import { describe, expect, it } from 'vitest';
import fixture from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema, type Schedule } from '@/lib/data/schema';
import { groupByDay } from './schedule';

const fixtureSchedule = ScheduleSchema.parse(fixture);

function makeSchedule(sessions: Schedule['sessions']): Schedule {
  return {
    ...fixtureSchedule,
    sessions,
    speakers: [],
  };
}

function session(overrides: Partial<Schedule['sessions'][number]> & { id: number }) {
  return {
    id: overrides.id,
    slug: overrides.slug ?? `session-${overrides.id}`,
    title: overrides.title ?? `Session ${overrides.id}`,
    kind: overrides.kind ?? ('talk' as const),
    format: overrides.format ?? null,
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    durationHours: overrides.durationHours ?? 1,
    abstractHtml: overrides.abstractHtml ?? '',
    tags: overrides.tags ?? [],
    speakerIds: overrides.speakerIds ?? [],
  };
}

describe('groupByDay', () => {
  it('orders days chronologically, not by insertion order', () => {
    const schedule = makeSchedule([
      session({ id: 1, startsAt: '2026-06-12T09:00:00Z', endsAt: '2026-06-12T10:00:00Z' }),
      session({ id: 2, startsAt: '2026-06-10T09:00:00Z', endsAt: '2026-06-10T10:00:00Z' }),
      session({ id: 3, startsAt: '2026-06-11T09:00:00Z', endsAt: '2026-06-11T10:00:00Z' }),
    ]);
    const groups = groupByDay(schedule);
    expect(groups.map((g) => g.dayKey)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });

  it('places the TBA bucket last with all undated sessions', () => {
    const schedule = makeSchedule([
      session({ id: 1, startsAt: null }),
      session({ id: 2, startsAt: '2026-06-10T09:00:00Z', endsAt: '2026-06-10T10:00:00Z' }),
      session({ id: 3, startsAt: null }),
    ]);
    const groups = groupByDay(schedule);
    expect(groups.at(-1)?.dayKey).toBe('TBA');
    expect(groups.at(-1)?.sessions.map((s) => s.id).sort()).toEqual([1, 3]);
    expect(groups[0]?.dayKey).toBe('2026-06-10');
  });

  it('sorts sessions within a day by startsAt ascending', () => {
    const schedule = makeSchedule([
      session({ id: 1, startsAt: '2026-06-10T14:00:00Z', endsAt: '2026-06-10T15:00:00Z' }),
      session({ id: 2, startsAt: '2026-06-10T09:00:00Z', endsAt: '2026-06-10T10:00:00Z' }),
      session({ id: 3, startsAt: '2026-06-10T11:30:00Z', endsAt: '2026-06-10T12:30:00Z' }),
    ]);
    const groups = groupByDay(schedule);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.sessions.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('returns an empty array for an empty schedule', () => {
    expect(groupByDay(makeSchedule([]))).toEqual([]);
  });
});
