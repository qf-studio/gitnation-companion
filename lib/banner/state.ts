export interface MinimalSession {
  id: number;
  slug: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface BannerInput {
  sessions: readonly MinimalSession[];
}

export type BannerState =
  | { kind: 'live'; session: MinimalSession; minutesRemaining: number }
  | { kind: 'upcoming'; session: MinimalSession; minutesUntil: number }
  | { kind: 'hidden' };

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Pure reducer: given a `now` Date and a Schedule, decide which banner state
 * to render. Operates on absolute UTC timestamps — never reads the wall clock,
 * never formats for a particular timezone. Display-side formatting is the
 * caller's responsibility.
 *
 * State rules (per design handoff §4.2):
 *   - `live`:     now ∈ [startsAt, endsAt] (both inclusive). When multiple
 *                 overlap, the session ending soonest wins.
 *   - `upcoming`: no live session AND some session starts within 6h of now.
 *                 The next-to-start session wins.
 *   - `hidden`:   otherwise.
 *
 * Minute calculations use `Math.ceil(deltaMs / 60_000)` so a half-minute reads
 * as "1 minute remaining" rather than rounding down to 0.
 */
export function computeBannerState(now: Date, input: BannerInput): BannerState {
  const nowMs = now.getTime();

  let liveBest: { session: MinimalSession; endMs: number } | undefined;
  let upcomingBest: { session: MinimalSession; startMs: number } | undefined;

  for (const s of input.sessions) {
    if (s.startsAt === null || s.endsAt === null) continue;
    const startMs = Date.parse(s.startsAt);
    const endMs = Date.parse(s.endsAt);

    if (nowMs >= startMs && nowMs <= endMs) {
      if (liveBest === undefined || endMs < liveBest.endMs) {
        liveBest = { session: s, endMs };
      }
      continue;
    }

    if (startMs > nowMs && startMs - nowMs <= SIX_HOURS_MS) {
      if (upcomingBest === undefined || startMs < upcomingBest.startMs) {
        upcomingBest = { session: s, startMs };
      }
    }
  }

  if (liveBest !== undefined) {
    return {
      kind: 'live',
      session: liveBest.session,
      minutesRemaining: Math.ceil((liveBest.endMs - nowMs) / 60_000),
    };
  }

  if (upcomingBest !== undefined) {
    return {
      kind: 'upcoming',
      session: upcomingBest.session,
      minutesUntil: Math.ceil((upcomingBest.startMs - nowMs) / 60_000),
    };
  }

  return { kind: 'hidden' };
}
