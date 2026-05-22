import { describe, expect, it } from 'vitest';
import fixture from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema, type Schedule } from '@/lib/data/schema';
import { search } from './search';

const fixtureSchedule = ScheduleSchema.parse(fixture);

describe('search', () => {
  it('returns [] for an empty query', () => {
    expect(search(fixtureSchedule, '')).toEqual([]);
    expect(search(fixtureSchedule, '   ')).toEqual([]);
  });

  it('matches case-insensitively on session title', () => {
    const hits = search(fixtureSchedule, 'react query');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.session.slug).toBe('react-query-beyond-the-basics-3339');
    expect(hits[0]?.matchedField).toBe('title');
  });

  it('folds diacritics so `cafe` matches `café`', () => {
    const schedule: Schedule = {
      ...fixtureSchedule,
      sessions: [
        {
          id: 1,
          slug: 'cafe-talk',
          title: 'Coding in a Café',
          kind: 'talk',
          format: null,
          startsAt: null,
          endsAt: null,
          durationHours: 1,
          abstractHtml: '',
          tags: [],
          speakerIds: [],
        },
      ],
      speakers: [],
    };
    const hits = search(schedule, 'cafe');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.session.id).toBe(1);
  });

  it('weights title (3) above speaker (2) above tag (1)', () => {
    // Build a schedule where "alpha" appears in multiple places.
    const schedule: Schedule = {
      ...fixtureSchedule,
      sessions: [
        {
          id: 1,
          slug: 's-title',
          title: 'Alpha Patterns',
          kind: 'talk',
          format: null,
          startsAt: null,
          endsAt: null,
          durationHours: 1,
          abstractHtml: '',
          tags: [],
          speakerIds: [],
        },
        {
          id: 2,
          slug: 's-tag',
          title: 'Beta Things',
          kind: 'talk',
          format: null,
          startsAt: null,
          endsAt: null,
          durationHours: 1,
          abstractHtml: '',
          tags: [{ label: 'alpha', slug: 'alpha', id: 99 }],
          speakerIds: [],
        },
        {
          id: 3,
          slug: 's-speaker',
          title: 'Gamma',
          kind: 'talk',
          format: null,
          startsAt: null,
          endsAt: null,
          durationHours: 1,
          abstractHtml: '',
          tags: [],
          speakerIds: [42],
        },
      ],
      speakers: [
        {
          id: 42,
          nickname: 'alpha_dev',
          name: 'Alpha Dev',
          avatar: null,
          company: null,
          location: null,
          bio: '',
          github: null,
          twitter: null,
          bluesky: null,
          twitterFollowers: null,
          companyLogo: null,
          sessionIds: [3],
        },
      ],
    };

    const hits = search(schedule, 'alpha');
    expect(hits.map((h) => h.session.id)).toEqual([1, 3, 2]);
    const byId = new Map(hits.map((h) => [h.session.id, h]));
    expect(byId.get(1)?.score).toBe(3);
    expect(byId.get(3)?.score).toBe(2);
    expect(byId.get(2)?.score).toBe(1);
    expect(byId.get(1)?.matchedField).toBe('title');
    expect(byId.get(3)?.matchedField).toBe('speaker');
    expect(byId.get(2)?.matchedField).toBe('tag');
  });

  it('handles Cyrillic / non-Latin input via NFD folding', () => {
    // Cyrillic "Й" decomposes into "И" + combining short. After stripping
    // diacritics, querying for "алексеи петров" should match "Алексей Петров".
    const schedule: Schedule = {
      ...fixtureSchedule,
      sessions: [
        {
          id: 1,
          slug: 'ru-talk',
          title: 'Доклад про TypeScript',
          kind: 'talk',
          format: null,
          startsAt: null,
          endsAt: null,
          durationHours: 1,
          abstractHtml: '',
          tags: [],
          speakerIds: [10],
        },
      ],
      speakers: [
        {
          id: 10,
          nickname: 'aleksei',
          name: 'Алексей Петров',
          avatar: null,
          company: null,
          location: null,
          bio: '',
          github: null,
          twitter: null,
          bluesky: null,
          twitterFollowers: null,
          companyLogo: null,
          sessionIds: [1],
        },
      ],
    };

    // Match on title (Cyrillic substring).
    const ruTitle = search(schedule, 'Доклад');
    expect(ruTitle).toHaveLength(1);
    expect(ruTitle[0]?.matchedField).toBe('title');

    // Match on speaker; "алексеи" (without й) folds to the same key as "алексей".
    const ruSpeaker = search(schedule, 'алексеи');
    expect(ruSpeaker).toHaveLength(1);
    expect(ruSpeaker[0]?.matchedField).toBe('speaker');
  });
});
