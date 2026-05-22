import { describe, expect, it } from 'vitest';
import fixture from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema } from '@/lib/data/schema';
import {
  getSessionsForSpeaker,
  getSpeakerByNickname,
  listSpeakers,
} from './speakers';

const schedule = ScheduleSchema.parse(fixture);

describe('getSpeakerByNickname', () => {
  it('returns the speaker for a known nickname', () => {
    const speaker = getSpeakerByNickname(schedule, 'wes_bos');
    expect(speaker?.id).toBe(18374);
    expect(speaker?.name).toBe('Wes Bos');
  });

  it('returns undefined for an unknown nickname', () => {
    expect(getSpeakerByNickname(schedule, 'no_such_handle')).toBeUndefined();
  });
});

describe('listSpeakers', () => {
  it('returns all speakers sorted by name ascending', () => {
    const names = listSpeakers(schedule).map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
    expect(names).toHaveLength(schedule.speakers.length);
  });
});

describe('getSessionsForSpeaker', () => {
  it('returns all sessions where the speaker id is included', () => {
    // 107776 (David Mark Clements) is on session 3693 (Pear).
    const sessions = getSessionsForSpeaker(schedule, 107776);
    expect(sessions.map((s) => s.id)).toEqual([3693]);
  });

  it('returns [] for a speaker with no sessions', () => {
    // 158211 (Oron Morad) has sessionIds: []
    expect(getSessionsForSpeaker(schedule, 158211)).toEqual([]);
  });
});
