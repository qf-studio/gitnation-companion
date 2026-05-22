import type { Schedule, Session } from '@/lib/data/schema';

export type SearchHit = {
  session: Session;
  score: number;
  matchedField: 'title' | 'speaker' | 'tag';
};

const WEIGHT_TITLE = 3;
const WEIGHT_SPEAKER = 2;
const WEIGHT_TAG = 1;

/**
 * Fold a string for diacritic-insensitive substring matching: NFD decompose,
 * strip combining marks, lower-case. Built on `String.prototype.normalize`
 * — no dependencies.
 */
function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Substring search across session titles, speaker names, and tag labels.
 *
 * Scoring:
 *   - title match    → +3
 *   - speaker match  → +2  (sum across the session's speakers)
 *   - tag label match → +1 (sum across the session's tags)
 *
 * `matchedField` is the highest-weighted field that contributed; ties favor
 * `title` over `speaker` over `tag`. Empty / whitespace queries return `[]`.
 * Results are sorted by `score` descending; ties retain input order.
 */
export function search(schedule: Schedule, q: string): SearchHit[] {
  const needle = fold(q.trim());
  if (needle.length === 0) return [];

  const speakerById = new Map(schedule.speakers.map((sp) => [sp.id, sp]));

  const hits: SearchHit[] = [];
  for (const session of schedule.sessions) {
    let score = 0;
    let topField: SearchHit['matchedField'] | null = null;
    let topWeight = -1;

    if (fold(session.title).includes(needle)) {
      score += WEIGHT_TITLE;
      if (WEIGHT_TITLE > topWeight) {
        topWeight = WEIGHT_TITLE;
        topField = 'title';
      }
    }

    for (const speakerId of session.speakerIds) {
      const speaker = speakerById.get(speakerId);
      if (speaker && fold(speaker.name).includes(needle)) {
        score += WEIGHT_SPEAKER;
        if (WEIGHT_SPEAKER > topWeight) {
          topWeight = WEIGHT_SPEAKER;
          topField = 'speaker';
        }
      }
    }

    for (const tag of session.tags) {
      if (fold(tag.label).includes(needle)) {
        score += WEIGHT_TAG;
        if (WEIGHT_TAG > topWeight) {
          topWeight = WEIGHT_TAG;
          topField = 'tag';
        }
      }
    }

    if (topField !== null) {
      hits.push({ session, score, matchedField: topField });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}
