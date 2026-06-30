import Link from 'next/link';
import { getSchedule } from '@/lib/data';
import { groupByDay } from '@/lib/queries/schedule';
import { listSessions } from '@/lib/queries/sessions';
import { ScreenHeader } from '@/components/server/ScreenHeader';
import { DaySwitcher } from '@/components/server/DaySwitcher';
import { TimeMarker } from '@/components/server/TimeMarker';
import { SessionCard } from '@/components/server/SessionCard';
import { formatSnapshot } from '@/lib/format/datetime';
import type { Session, Speaker } from '@/lib/data/schema';

export default function SchedulePage() {
  const schedule = getSchedule();
  const days = groupByDay(schedule).filter((d) => d.dayKey !== 'TBA');
  const talkCount = listSessions(schedule, { dated: false, kind: 'talk' }).length;
  const speakersById = new Map<number, Speaker>(schedule.speakers.map((s) => [s.id, s]));

  return (
    <>
      <ScreenHeader
        kicker="JSNATION 2026"
        title="Conference Companion"
        subtitle={`${schedule.event.location} · ${formatEventWindow(schedule.event.startDate, schedule.event.endDate)}`}
      />

      <DaySwitcher
        dayKeys={days.map((d) => d.dayKey)}
        activeDayKey={days[0]?.dayKey ?? ''}
      />

      {days.map((day, i) => (
        <section key={day.dayKey} id={`day-${i + 1}`} style={{ paddingTop: 12 }}>
          {groupBySlot(day.sessions).map((slot) => (
            <div key={slot.startsAt} style={{ marginBottom: 12 }}>
              <TimeMarker startsAt={slot.startsAt} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slot.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    speakers={session.speakerIds
                      .map((id) => speakersById.get(id))
                      .filter((s): s is Speaker => s !== undefined)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      {talkCount > 0 ? (
        <section style={{ padding: '24px 16px 12px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 8,
            }}
          >
            Schedule TBA — {talkCount} talks announced
          </div>
          <Link
            href="/search?kind=talk"
            style={{
              display: 'block',
              padding: '14px 16px',
              borderRadius: 12,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Browse all talks →
          </Link>
        </section>
      ) : null}

      <footer
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--color-text-faint)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div>
          <span style={{ color: 'var(--color-brand-on-surface)', fontWeight: 600 }}>
            {schedule.event.hashtag}
          </span>
          {schedule.event.discordUrl ? (
            <>
              {' · '}
              <a
                href={schedule.event.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Discord
              </a>
            </>
          ) : null}
        </div>
        <div>Snapshot: {formatSnapshot(schedule.fetchedAt)}</div>
        <div>© 2026 React Summit</div>
      </footer>
    </>
  );
}

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

function formatEventWindow(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  return `${fmt.format(new Date(startIso))}–${fmt.format(new Date(endIso))}`;
}
