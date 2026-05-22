import { getSchedule } from '@/lib/data';
import { groupByDay } from '@/lib/queries/schedule';
import { ScreenHeader } from '@/components/server/ScreenHeader';
import { TimeMarker } from '@/components/server/TimeMarker';
import { SessionCard } from '@/components/server/SessionCard';
import { FavoritesSkeleton } from '@/components/server/FavoritesSkeleton';
import { EmptyState } from '@/components/server/EmptyState';
import { FavoritesGate } from '@/components/client/FavoritesGate';
import { FavoritesCount } from '@/components/client/FavoritesCount';
import { FavoritesEmpty } from '@/components/client/FavoritesEmpty';
import { PreMountOnly } from '@/components/client/PreMountOnly';
import type { Session, Speaker } from '@/lib/data/schema';

interface Slot {
  startsAt: string;
  sessions: Session[];
}

function groupBySlot(sessions: Session[]): Slot[] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!s.startsAt) continue;
    const bucket = map.get(s.startsAt);
    if (bucket) bucket.push(s);
    else map.set(s.startsAt, [s]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startsAt, sess]) => ({ startsAt, sessions: sess }));
}

export default function SavedPage() {
  const schedule = getSchedule();
  const days = groupByDay(schedule).filter((d) => d.dayKey !== 'TBA');
  const speakersById = new Map<number, Speaker>(schedule.speakers.map((s) => [s.id, s]));

  return (
    <>
      <ScreenHeader title="Saved" subtitle={<FavoritesCount /> as unknown as string} />

      <PreMountOnly>
        <FavoritesSkeleton />
      </PreMountOnly>

      {days.map((day, i) => (
        <section key={day.dayKey} id={`day-${i + 1}`} style={{ paddingTop: 12 }}>
          {groupBySlot(day.sessions).map((slot) => (
            <div key={slot.startsAt} style={{ marginBottom: 12 }}>
              <FavoritesGate
                sessionId={-1 /* sentinel: any of this slot's sessions favorited? handled per-card below */}
              >
                <></>
              </FavoritesGate>
              <TimeMarker startsAt={slot.startsAt} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slot.sessions.map((session) => {
                  const sps = session.speakerIds
                    .map((id) => speakersById.get(id))
                    .filter((s): s is Speaker => s !== undefined);
                  return (
                    <FavoritesGate key={session.id} sessionId={session.id}>
                      <SessionCard session={session} speakers={sps} />
                    </FavoritesGate>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <FavoritesEmpty>
        <EmptyState
          icon={
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 3 14.9 9.3 22 10.2 17 15 18.2 22 12 18.6 5.8 22 7 15 2 10.2 9.1 9.3" />
            </svg>
          }
          title="No sessions saved yet"
          body="Tap the star on any session on the Schedule to keep it here. Your list survives the conference closing the venue WiFi."
        />
      </FavoritesEmpty>
    </>
  );
}
