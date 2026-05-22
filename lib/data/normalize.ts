import { z } from 'zod';
import type { Schedule, Session, Speaker, Tag, Event } from './schema';

// --- Raw upstream shapes (subset we care about) -----------------------------
//
// We intentionally do NOT mirror the entire upstream payload. We validate only
// the fields the normalizer reads. Everything else is dropped.

const RawSessionUserSchema = z.object({
  id: z.number().int(),
  nickname: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  company: z.string().nullish(),
  location: z.string().nullish(),
  bio: z.string().nullish(),
  github: z.string().nullish(),
  twitter: z.string().nullish(),
  twitterFollowers: z.number().nullish(),
});

const RawSessionTagSchema = z.object({
  label: z.string(),
  slug: z.string(),
});

const RawSessionSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  text: z.string().nullish(),
  duration: z.number(),
  format: z.enum(['InPerson', 'Remote']).nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  tags: z.array(RawSessionTagSchema),
  users: z.array(RawSessionUserSchema),
  category: z.number().int(),
});

const RawSpeakerSchema = z.object({
  id: z.number().int(),
  nickname: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  company: z.string().nullish(),
  location: z.string().nullish(),
  bio: z.string().nullish(),
  github: z.string().nullish(),
  twitter: z.string().nullish(),
  bluesky: z.string().nullish(),
  twitterFollowers: z.number().nullish(),
  Company: z
    .object({
      name: z.string().nullish(),
      logo: z.string().nullish(),
    })
    .nullish(),
});

const RawTopTagSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  slug: z.string(),
});

const RawEventSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().nullish(),
  hashtag: z.string().nullish(),
  discordUrl: z.string().nullish(),
  domain: z.string().nullish(),
  tagline: z.string().nullish(),
  logo: z.string().nullish(),
  noExactDate: z.boolean().nullish(),
  isRegistrationOpen: z.boolean().nullish(),
  ticketsURL: z.string().nullish(),
});

export const RawPagePropsSchema = z.object({
  event: RawEventSchema,
  contents: z.array(RawSessionSchema),
  speakers: z.array(RawSpeakerSchema),
  tags: z.array(RawTopTagSchema),
});

export const RawEnvelopeSchema = z.object({
  pageProps: RawPagePropsSchema,
});

type RawEnvelope = z.infer<typeof RawEnvelopeSchema>;
type RawSpeaker = z.infer<typeof RawSpeakerSchema>;
type RawSessionUser = z.infer<typeof RawSessionUserSchema>;

export type NormalizeOptions = {
  /** ISO timestamp stamped into `fetchedAt`. Defaults to `new Date().toISOString()`. */
  fetchedAt?: string;
};

// --- Helpers ---------------------------------------------------------------

function kindFromCategory(category: number): 'talk' | 'workshop' {
  if (category === 2) return 'workshop';
  // Default to "talk" for category 0 and any future unknown variant — we have
  // no other meaningful mapping and "talk" is the safe display fallback.
  return 'talk';
}

function nullish<T>(v: T | undefined | null): T | null {
  return v === undefined || v === null ? null : v;
}

function buildEvent(raw: RawEnvelope['pageProps']['event']): Event {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    startDate: raw.startDate,
    endDate: raw.endDate,
    location: raw.location ?? '',
    hashtag: raw.hashtag ?? '',
    discordUrl: nullish(raw.discordUrl),
    domain: nullish(raw.domain),
    tagline: nullish(raw.tagline),
    logo: nullish(raw.logo),
    noExactDate: raw.noExactDate ?? false,
    isRegistrationOpen: raw.isRegistrationOpen ?? false,
    ticketsURL: nullish(raw.ticketsURL),
  };
}

function buildSessions(
  rawSessions: RawEnvelope['pageProps']['contents'],
  tagIdBySlug: Map<string, number>,
): Session[] {
  return rawSessions.map((s): Session => {
    const tags: Tag[] = s.tags.map((t) => ({
      label: t.label,
      slug: t.slug,
      id: tagIdBySlug.get(t.slug) ?? null,
    }));

    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      kind: kindFromCategory(s.category),
      format: s.format ?? null,
      startsAt: s.startDate ?? null,
      endsAt: s.endDate ?? null,
      durationHours: s.duration,
      abstractHtml: s.text ?? '',
      tags,
      speakerIds: s.users.map((u) => u.id),
    };
  });
}

function speakerFromTopLevel(
  raw: RawSpeaker,
  sessionIds: number[],
): Speaker {
  return {
    id: raw.id,
    nickname: raw.nickname,
    name: raw.name,
    avatar: nullish(raw.avatar),
    company: nullish(raw.company),
    location: nullish(raw.location),
    bio: raw.bio ?? '',
    github: nullish(raw.github),
    twitter: nullish(raw.twitter),
    bluesky: nullish(raw.bluesky),
    twitterFollowers: nullish(raw.twitterFollowers),
    companyLogo: nullish(raw.Company?.logo),
    sessionIds,
  };
}

function speakerFromInlineUser(
  inline: RawSessionUser,
  sessionIds: number[],
): Speaker {
  // Orphan direction A: this speaker id appears in session.users[] but not in
  // the top-level speakers[]. Top-level-only fields (bluesky, Company) are
  // unrecoverable here, so we explicitly null them out.
  return {
    id: inline.id,
    nickname: inline.nickname,
    name: inline.name,
    avatar: nullish(inline.avatar),
    company: nullish(inline.company),
    location: nullish(inline.location),
    bio: inline.bio ?? '',
    github: nullish(inline.github),
    twitter: nullish(inline.twitter),
    bluesky: null,
    twitterFollowers: nullish(inline.twitterFollowers),
    companyLogo: null,
    sessionIds,
  };
}

function buildSpeakers(
  rawSpeakers: RawSpeaker[],
  rawSessions: RawEnvelope['pageProps']['contents'],
): Speaker[] {
  // 1. Build speakerId → sessionIds map by scanning sessions[].users[] (the
  //    only reliable back-link; speakers[].contents[] is title-only).
  const sessionIdsBySpeaker = new Map<number, number[]>();
  const inlineById = new Map<number, RawSessionUser>();
  for (const session of rawSessions) {
    for (const user of session.users) {
      const existing = sessionIdsBySpeaker.get(user.id) ?? [];
      // Defensive dedupe — same session/user pair shouldn't appear twice but
      // we don't want a duplicate id sneaking into sessionIds either.
      if (!existing.includes(session.id)) existing.push(session.id);
      sessionIdsBySpeaker.set(user.id, existing);
      if (!inlineById.has(user.id)) inlineById.set(user.id, user);
    }
  }

  const out: Speaker[] = [];
  const seenIds = new Set<number>();

  // 2. Emit top-level speakers in their original order. This includes orphan
  //    direction B (present but unreferenced — sessionIds will be []).
  for (const raw of rawSpeakers) {
    if (seenIds.has(raw.id)) continue;
    seenIds.add(raw.id);
    out.push(speakerFromTopLevel(raw, sessionIdsBySpeaker.get(raw.id) ?? []));
  }

  // 3. Append synthetic speakers for orphan direction A — ids referenced by a
  //    session but missing from the top-level speakers[].
  for (const [speakerId, sessionIds] of sessionIdsBySpeaker) {
    if (seenIds.has(speakerId)) continue;
    const inline = inlineById.get(speakerId);
    if (!inline) continue; // unreachable: by construction inlineById has every id
    seenIds.add(speakerId);
    out.push(speakerFromInlineUser(inline, sessionIds));
  }

  return out;
}

// --- Entry point -----------------------------------------------------------

export function normalize(input: unknown, options: NormalizeOptions = {}): Schedule {
  const parsed = RawEnvelopeSchema.parse(input);
  const p = parsed.pageProps;

  const tagIdBySlug = new Map<string, number>();
  for (const t of p.tags) tagIdBySlug.set(t.slug, t.id);

  return {
    event: buildEvent(p.event),
    sessions: buildSessions(p.contents, tagIdBySlug),
    speakers: buildSpeakers(p.speakers, p.contents),
    fetchedAt: options.fetchedAt ?? new Date().toISOString(),
  };
}
