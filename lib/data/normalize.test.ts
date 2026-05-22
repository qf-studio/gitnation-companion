import { describe, expect, it } from 'vitest';
import raw from '@/data/__fixtures__/raw-gitnation.min.json';
import expected from '@/data/__fixtures__/expected-normalized.json';
import { normalize } from './normalize';

const FIXED_FETCHED_AT = '2026-05-22T00:00:00.000Z';

describe('normalize', () => {
  it('produces the golden Schedule output for the curated raw fixture', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    expect(out).toEqual(expected);
  });

  it('maps category 0 to kind "talk"', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const wesTalk = out.sessions.find((s) => s.slug === 'agentic-interfaces-talk');
    expect(wesTalk?.kind).toBe('talk');
  });

  it('maps category 2 to kind "workshop"', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const rq = out.sessions.find((s) => s.slug === 'react-query-beyond-the-basics-3339');
    expect(rq?.kind).toBe('workshop');
  });

  it('keeps startsAt/endsAt null when startDate is null', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const wesTalk = out.sessions.find((s) => s.slug === 'agentic-interfaces-talk');
    expect(wesTalk?.startsAt).toBeNull();
    expect(wesTalk?.endsAt).toBeNull();
  });

  it('preserves InPerson and Remote format strings verbatim', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const inPerson = out.sessions.find((s) => s.format === 'InPerson');
    const remote = out.sessions.find((s) => s.format === 'Remote');
    expect(inPerson).toBeTruthy();
    expect(remote).toBeTruthy();
  });

  it('passes through ISO start/end dates from raw startDate', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const rq = out.sessions.find((s) => s.slug === 'react-query-beyond-the-basics-3339');
    expect(rq?.startsAt).toBe('2026-06-10T12:00:00.000Z');
    expect(rq?.endsAt).toBe('2026-06-10T16:00:00.000Z');
  });

  it('enriches speakers from top-level speakers[] — bluesky + companyLogo are present', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const wes = out.speakers.find((s) => s.id === 18374);
    const sacha = out.speakers.find((s) => s.id === 136488);
    expect(wes?.bluesky).toBe('wesbos.com');
    expect(sacha?.companyLogo).toBe('https://cdn.example.com/devographics-logo.png');
  });

  it('builds speaker.sessionIds by scanning sessions[].users[], not speaker.contents[]', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const david = out.speakers.find((s) => s.id === 107776);
    // David is referenced by exactly one session in the fixture.
    expect(david?.sessionIds).toEqual([3693]);
  });

  it('orphan direction A: synthesizes a speaker from inline users[] when missing from top-level speakers[]', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const mikkel = out.speakers.find((s) => s.id === 158469);
    expect(mikkel).toBeDefined();
    expect(mikkel?.bluesky).toBeNull();
    expect(mikkel?.companyLogo).toBeNull();
    expect(mikkel?.sessionIds).toEqual([3693]);
  });

  it('orphan direction B: keeps top-level speakers not referenced by any session, with sessionIds: []', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const oron = out.speakers.find((s) => s.id === 158211);
    expect(oron).toBeDefined();
    expect(oron?.sessionIds).toEqual([]);
  });

  it('treats missing/null session.text as an empty abstractHtml string', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const sacha = out.sessions.find((s) => s.slug === 'the-state-of-ai-for-web-development');
    const defensive = out.sessions.find((s) => s.slug === 'defensive-empty-users-no-text');
    expect(sacha?.abstractHtml).toBe('');
    expect(defensive?.abstractHtml).toBe('');
  });

  it('handles empty users[] without throwing and yields speakerIds: []', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const defensive = out.sessions.find((s) => s.slug === 'defensive-empty-users-no-text');
    expect(defensive?.speakerIds).toEqual([]);
  });

  it('enriches session tags with the top-level id when slug matches; falls back to null id otherwise', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const wesTalk = out.sessions.find((s) => s.slug === 'agentic-interfaces-talk');
    expect(wesTalk?.tags[0]).toEqual({
      label: 'artificial intelligence',
      slug: 'artificial-intelligence',
      id: 51,
    });
  });

  it('dedupes speaker references when normalizing (single entry per unique speaker id)', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    const ids = out.speakers.map((s) => s.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('drops decorative envelope fields like _superjson and attendees', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    // The Schedule shape has no slot for these; merely asserting they don't leak.
    expect(Object.keys(out)).toEqual(['event', 'sessions', 'speakers', 'fetchedAt']);
  });

  it('event subset keeps only the contract fields', () => {
    const out = normalize(raw, { fetchedAt: FIXED_FETCHED_AT });
    expect(Object.keys(out.event).sort()).toEqual(
      [
        'description',
        'discordUrl',
        'domain',
        'endDate',
        'hashtag',
        'id',
        'isRegistrationOpen',
        'location',
        'logo',
        'name',
        'noExactDate',
        'slug',
        'startDate',
        'tagline',
        'ticketsURL',
      ].sort(),
    );
  });

  it('throws when the upstream payload is missing pageProps', () => {
    expect(() => normalize({}, { fetchedAt: FIXED_FETCHED_AT })).toThrow();
  });
});
