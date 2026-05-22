import { z } from 'zod';

const IsoDateTimeString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/,
    'expected an ISO-8601 datetime string',
  );

export const EventSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  startDate: IsoDateTimeString,
  endDate: IsoDateTimeString,
  location: z.string(),
  hashtag: z.string(),
  discordUrl: z.string().nullable(),
  domain: z.string().nullable(),
  tagline: z.string().nullable(),
  logo: z.string().nullable(),
  noExactDate: z.boolean(),
  isRegistrationOpen: z.boolean(),
  ticketsURL: z.string().nullable(),
});

export const TagSchema = z.object({
  label: z.string(),
  slug: z.string(),
  id: z.number().int().nullable(),
});

export const SessionSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  title: z.string(),
  kind: z.enum(['talk', 'workshop']),
  format: z.enum(['InPerson', 'Remote']).nullable(),
  startsAt: IsoDateTimeString.nullable(),
  endsAt: IsoDateTimeString.nullable(),
  durationHours: z.number(),
  abstractHtml: z.string(),
  tags: z.array(TagSchema),
  speakerIds: z.array(z.number().int()),
});

export const SpeakerSchema = z.object({
  id: z.number().int(),
  nickname: z.string().min(1),
  name: z.string(),
  avatar: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  bio: z.string(),
  github: z.string().nullable(),
  twitter: z.string().nullable(),
  bluesky: z.string().nullable(),
  twitterFollowers: z.number().nullable(),
  companyLogo: z.string().nullable(),
  sessionIds: z.array(z.number().int()),
});

export const ScheduleSchema = z.object({
  event: EventSchema,
  sessions: z.array(SessionSchema),
  speakers: z.array(SpeakerSchema),
  fetchedAt: IsoDateTimeString,
});

export type Event = z.infer<typeof EventSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Speaker = z.infer<typeof SpeakerSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
