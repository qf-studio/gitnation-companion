import Link from 'next/link';
import { getSchedule } from '@/lib/data';
import { groupByDay } from '@/lib/queries/schedule';
import ScreenHeader from '@/components/server/ScreenHeader';
import DaySwitcher from '@/components/server/DaySwitcher';
import TimeMarker from '@/components/server/TimeMarker';
import SessionCard from '@/components/server/SessionCard';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function dayLabel(dayKey: string, index: number): { label: string; sublabel: string } {
  const date = new Date(dayKey + 'T00:00:00Z');
  const sublabel = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  return { label: `Day ${index + 1}`, sublabel };
}

export default function Page() {
  const schedule = getSchedule();
  const dayGroups = groupByDay(schedule);
  const datedGroups = dayGroups.filter((g) => g.dayKey !== 'TBA');
  const tbaGroup = dayGroups.find((g) => g.dayKey === 'TBA');
  const talkCount = tbaGroup?.sessions.length ?? 0;

  const now = new Date();

  const days = datedGroups.map((g, i) => ({ dayKey: g.dayKey, ...dayLabel(g.dayKey, i) }));
  const activeDay = days[0]?.dayKey ?? '';

  const speakersMap = new Map(schedule.speakers.map((sp) => [sp.id, sp]));

  return (
    <div style={{ paddingBottom: 16 }}>
      <ScreenHeader
        kicker="JSNATION 2026"
        title="Conference Companion"
        subtitle={`${schedule.event.location}`}
      />

      {days.length > 1 && (
        <DaySwitcher days={days} activeDay={activeDay} />
      )}

      {datedGroups.map((group, dayIndex) => {
        // Group sessions within this day by their startsAt time
        const slotMap = new Map<string, typeof group.sessions>();
        for (const s of group.sessions) {
          const key = s.startsAt ?? 'unknown';
          const slot = slotMap.get(key);
          if (slot) slot.push(s);
          else slotMap.set(key, [s]);
        }

        return (
          <section key={group.dayKey} id={`day-${dayIndex + 1}`}>
            {[...slotMap.entries()].map(([time, sessions]) => {
              const slotStart = new Date(time);
              const isLive = sessions.some(
                (s) => s.endsAt && slotStart <= now && now < new Date(s.endsAt),
              );

              return (
                <div key={time} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TimeMarker time={time} isLive={isLive} />
                  {sessions.map((session) => {
                    const speakers = session.speakerIds.map((id) => speakersMap.get(id)).filter(Boolean) as ReturnType<typeof schedule.speakers.filter>;
                    return (
                      <SessionCard
                        key={session.id}
                        session={session}
                        speakers={speakers}
                        now={now}
                      />
                    );
                  })}
                </div>
              );
            })}
          </section>
        );
      })}

      {talkCount > 0 && (
        <div style={{ margin: '16px 12px 0' }}>
          <Link
            href="/search?kind=talk"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <span>Browse all talks ({talkCount})</span>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      )}

      <footer
        style={{
          margin: '24px 16px 8px',
          paddingTop: 16,
          borderTop: '0.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-faint)' }}>
          {schedule.event.hashtag && (
            <span>#{schedule.event.hashtag}</span>
          )}
          {schedule.event.discordUrl && (
            <a
              href={schedule.event.discordUrl}
              style={{ color: 'var(--brand-on-surface)', textDecoration: 'none' }}
            >
              Discord
            </a>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)' }}>
          Snapshot: {formatDate(schedule.fetchedAt)}
        </p>
      </footer>
    </div>
  );
}
