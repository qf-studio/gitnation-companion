import { describe, expect, it } from 'vitest';
import fixture from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema, type Schedule, type Session } from '@/lib/data/schema';
import { computeBannerState } from './state';

const fixtureSchedule = ScheduleSchema.parse(fixture);

function session(overrides: Partial<Session> & { id: number }): Session {
  return {
    id: overrides.id,
    slug: overrides.slug ?? `session-${overrides.id}`,
    title: overrides.title ?? `Session ${overrides.id}`,
    kind: overrides.kind ?? 'talk',
    format: overrides.format ?? null,
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    durationHours: overrides.durationHours ?? 1,
    abstractHtml: overrides.abstractHtml ?? '',
    tags: overrides.tags ?? [],
    speakerIds: overrides.speakerIds ?? [],
  };
}

function makeSchedule(sessions: Session[]): Schedule {
  return { ...fixtureSchedule, sessions, speakers: [] };
}

describe('computeBannerState — live', () => {
  it('returns live at the exact start (inclusive boundary)', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T10:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.session.id).toBe(1);
      expect(state.minutesRemaining).toBe(60);
    }
  });

  it('returns live at the midpoint', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T10:30:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.minutesRemaining).toBe(30);
    }
  });

  it('returns live at the exact end (inclusive boundary)', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T11:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.minutesRemaining).toBe(0);
    }
  });

  it('picks the session ending soonest when multiple overlap', () => {
    const ending_later = session({
      id: 1,
      startsAt: '2026-06-12T09:00:00Z',
      endsAt: '2026-06-12T12:00:00Z',
    });
    const ending_soonest = session({
      id: 2,
      startsAt: '2026-06-12T09:30:00Z',
      endsAt: '2026-06-12T10:30:00Z',
    });
    const state = computeBannerState(
      new Date('2026-06-12T10:00:00Z'),
      makeSchedule([ending_later, ending_soonest]),
    );
    expect(state.kind).toBe('live');
    if (state.kind === 'live') {
      expect(state.session.id).toBe(2);
      expect(state.minutesRemaining).toBe(30);
    }
  });
});

describe('computeBannerState — upcoming', () => {
  it('returns upcoming when a session starts within 6 hours', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T14:00:00Z',
      endsAt: '2026-06-12T15:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T11:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('upcoming');
    if (state.kind === 'upcoming') {
      expect(state.session.id).toBe(1);
      expect(state.minutesUntil).toBe(180);
    }
  });

  it('picks the next-to-start session when several are within 6h', () => {
    const later = session({
      id: 1,
      startsAt: '2026-06-12T16:00:00Z',
      endsAt: '2026-06-12T17:00:00Z',
    });
    const sooner = session({
      id: 2,
      startsAt: '2026-06-12T13:00:00Z',
      endsAt: '2026-06-12T14:00:00Z',
    });
    const state = computeBannerState(
      new Date('2026-06-12T11:00:00Z'),
      makeSchedule([later, sooner]),
    );
    expect(state.kind).toBe('upcoming');
    if (state.kind === 'upcoming') {
      expect(state.session.id).toBe(2);
      expect(state.minutesUntil).toBe(120);
    }
  });

  it('returns upcoming exactly 6h before next start', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T18:00:00Z',
      endsAt: '2026-06-12T19:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T12:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('upcoming');
    if (state.kind === 'upcoming') {
      expect(state.minutesUntil).toBe(360);
    }
  });
});

describe('computeBannerState — hidden', () => {
  it('returns hidden when no session is live or within 6 hours', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T20:00:00Z',
      endsAt: '2026-06-12T21:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T12:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('hidden');
  });

  it('returns hidden 6h + 1 second before next start (just past the horizon)', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T18:00:00Z',
      endsAt: '2026-06-12T19:00:00Z',
    });
    // 6h + 1s before 18:00 = 11:59:59
    const state = computeBannerState(new Date('2026-06-12T11:59:59Z'), makeSchedule([s]));
    expect(state.kind).toBe('hidden');
  });

  it('returns hidden when only undated sessions exist', () => {
    const s = session({ id: 1, startsAt: null, endsAt: null });
    const state = computeBannerState(new Date('2026-06-12T12:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('hidden');
  });

  it('returns hidden when the schedule has no sessions', () => {
    const state = computeBannerState(new Date('2026-06-12T12:00:00Z'), makeSchedule([]));
    expect(state.kind).toBe('hidden');
  });
});

describe('computeBannerState — boundaries', () => {
  it('exact start → live, not upcoming', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T10:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('live');
  });

  it('exact end → still live', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T11:00:00Z'), makeSchedule([s]));
    expect(state.kind).toBe('live');
  });

  it('one second after end with no other live session → upcoming/hidden, not live', () => {
    const s = session({
      id: 1,
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    });
    const state = computeBannerState(new Date('2026-06-12T11:00:01Z'), makeSchedule([s]));
    expect(state.kind).toBe('hidden');
  });
});

describe('computeBannerState — TZ regression', () => {
  it('uses absolute UTC math regardless of local clock', () => {
    // 13:00 Amsterdam == 11:00 UTC; session at 13:30 Amsterdam == 11:30 UTC.
    const schedule = makeSchedule([
      session({
        id: 1,
        startsAt: '2026-06-12T11:30:00Z',
        endsAt: '2026-06-12T12:30:00Z',
      }),
    ]);
    const state = computeBannerState(new Date('2026-06-12T11:00:00Z'), schedule);
    expect(state.kind).toBe('upcoming');
    if (state.kind === 'upcoming') {
      expect(state.minutesUntil).toBe(30);
    }
  });
});
