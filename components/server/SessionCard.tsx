import type { Session, Speaker } from '@/lib/data/schema';
import KindChip from './KindChip';
import Avatar from './Avatar';

interface SessionCardProps {
  session: Session;
  speakers: Speaker[];
  now?: Date;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export default function SessionCard({ session, speakers, now = new Date() }: SessionCardProps) {
  const isPast = session.endsAt != null && new Date(session.endsAt) < now;
  const isKeynote = (session.kind as string) === 'keynote';

  const sessionSpeakers = speakers.filter((sp) => session.speakerIds.includes(sp.id));
  const displaySpeakers = sessionSpeakers.slice(0, 2);
  const speakerNames = displaySpeakers.map((s) => s.name).join(', ');

  return (
    <article
      data-testid="session-card"
      style={{
        margin: '0 12px',
        borderRadius: 14,
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        overflow: 'hidden',
        opacity: isPast ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* 3px left stripe */}
      <div
        style={{
          width: 3,
          background: 'var(--border-2)',
          flexShrink: 0,
        }}
      />

      {/* Card content */}
      <div
        style={{
          flex: 1,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 0,
        }}
      >
        {/* Row 1: time · spacer · KindChip · star placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {session.startsAt && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {formatTime(session.startsAt)}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <KindChip kind={session.kind} />
          {/* FavoriteStar placeholder — interactive behaviour added in TASK-06 */}
          <span
            data-testid="favorite-toggle"
            style={{ width: 22, height: 22, flexShrink: 0, color: 'var(--star-off)' }}
            aria-label="Save session"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={22} height={22}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        </div>

        {/* Row 2: title */}
        <h3
          style={{
            margin: 0,
            fontSize: isKeynote ? 17 : 16,
            fontWeight: isKeynote ? 700 : 600,
            letterSpacing: '-0.3px',
            lineHeight: 1.25,
            color: 'var(--text)',
          }}
        >
          {session.title}
        </h3>

        {/* Row 3: avatars + speaker names */}
        {displaySpeakers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex' }}>
              {displaySpeakers.map((sp, i) => (
                <span key={sp.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                  <Avatar url={sp.avatar} name={sp.name} size={22} />
                </span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {speakerNames}
            </span>
          </div>
        )}

        {/* Row 4: workshop duration */}
        {session.kind === 'workshop' && session.durationHours > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {session.durationHours}h workshop
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
