import type { Schedule, Session, Speaker } from '@/lib/data/schema';

/**
 * Find a speaker by their nickname. Returns `undefined` if not found.
 */
export function getSpeakerByNickname(
  schedule: Schedule,
  nickname: string,
): Speaker | undefined {
  return schedule.speakers.find((s) => s.nickname === nickname);
}

/**
 * List all speakers sorted by `name` ascending (locale-aware compare).
 * Does not mutate the input array.
 */
export function listSpeakers(schedule: Schedule): Speaker[] {
  return [...schedule.speakers].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Return the sessions whose `speakerIds` includes the given speaker id.
 */
export function getSessionsForSpeaker(schedule: Schedule, speakerId: number): Session[] {
  return schedule.sessions.filter((s) => s.speakerIds.includes(speakerId));
}
