import Link from 'next/link';
import type { Session, Speaker } from '@/lib/data/schema';
import { Avatar } from './Avatar';
import { KindChip } from './KindChip';
import { LiveDot } from './LiveDot';
import { formatTime } from '@/lib/format/datetime';

interface SessionCardProps {
  session: Session;
  speakers: Speaker[];
  status?: 'before' | 'live' | 'after';
}

function stripeColor(kind: Session['kind']): string {
  return kind === 'workshop' ? 'var(--color-brand)' : 'var(--color-border-2)';
}

export function SessionCard({ session, speakers, status = 'before' }: SessionCardProps) {
  const isLive = status === 'live';
  const isPast = status === 'after';
  const shownSpeakers = speakers.slice(0, 2);
  const extraSpeakerCount = Math.max(0, speakers.length - shownSpeakers.length);

  return (
    <Link
      href={`/sessions/${session.slug}`}
      data-testid="session-card"
      style={{
        display: 'block',
        margin: '0 12px',
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: 14,
        opacity: isPast ? 0.5 : 1,
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: stripeColor(session.kind),
        }}
      />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session.startsAt ? (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
              }}
            >
              {formatTime(session.startsAt)}
            </span>
          ) : null}
          {isLive ? <LiveDot /> : null}
          <span style={{ flex: 1 }} />
          <KindChip kind={session.kind} />
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: -0.3,
            lineHeight: 1.25,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {session.title}
        </h3>
        {shownSpeakers.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {shownSpeakers.map((sp, i) => (
                <span
                  key={sp.id}
                  style={{ marginLeft: i === 0 ? 0 : -8, display: 'inline-flex' }}
                >
                  <Avatar url={sp.avatar} name={sp.name} size={22} />
                </span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {shownSpeakers.map((sp) => sp.name).join(', ')}
              {extraSpeakerCount > 0 ? ` +${extraSpeakerCount}` : ''}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
