import { cache } from 'react';
import snapshot from '@/data/schedule.snapshot.json';
import { ScheduleSchema, type Schedule } from './schema';

/**
 * Read the committed schedule snapshot, validating it on first call.
 *
 * - `cache()` dedupes the parse across the RSC tree within a single request.
 * - `ScheduleSchema.parse` (not `safeParse`) is intentional: upstream schema
 *   drift should fail the build loudly, not silently render an empty page.
 */
export const getSchedule = cache((): Schedule => ScheduleSchema.parse(snapshot));

export type { Schedule, Event, Session, Speaker, Tag } from './schema';
