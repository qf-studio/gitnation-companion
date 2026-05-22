import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSchedule } from '@/lib/data';
import { getSessionBySlug, listSessions } from '@/lib/queries/sessions';
import { PushHeader } from '@/components/server/PushHeader';
import { FavoriteStar } from '@/components/client/FavoriteStar';
import { KindChip } from '@/components/server/KindChip';
import { SpeakerRow } from '@/components/server/SpeakerRow';
import { Abstract } from '@/components/server/Abstract';
import { formatDayName, formatTimeRange } from '@/lib/format/datetime';
import type { Speaker } from '@/lib/data/schema';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const schedule = getSchedule();
  return listSessions(schedule).map((s) => ({ slug: s.slug }));
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const schedule = getSchedule();
  const session = getSessionBySlug(schedule, slug);
  if (!session) notFound();

  const speakersById = new Map<number, Speaker>(schedule.speakers.map((s) => [s.id, s]));
  const speakers = session.speakerIds
    .map((id) => speakersById.get(id))
    .filter((s): s is Speaker => s !== undefined);

  return (
    <>
      <PushHeader
        backHref="/"
        accessory={<FavoriteStar sessionId={session.id} size={26} />}
      />
      <article style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KindChip kind={session.kind} />
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.6,
            lineHeight: 1.2,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {session.title}
        </h1>

        {session.startsAt && session.endsAt ? (
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <SectionLabel>When</SectionLabel>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {formatTimeRange(session.startsAt, session.endsAt)}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--color-text-muted)' }}>
              {formatDayName(session.startsAt)}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            <SectionLabel>When</SectionLabel>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              Schedule TBA
            </div>
          </div>
        )}

        {speakers.length > 0 ? (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel>Speakers</SectionLabel>
            <div
              style={{
                borderRadius: 14,
                border: '0.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
              }}
            >
              {speakers.map((sp, i) => (
                <div
                  key={sp.id}
                  style={i === 0 ? { borderTop: 'none' } : undefined}
                >
                  <SpeakerRow speaker={sp} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {session.abstractHtml ? (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel>About</SectionLabel>
            <Abstract html={session.abstractHtml} />
          </section>
        ) : null}

        {session.tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {session.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/search?q=${encodeURIComponent(tag.label)}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '0.5px solid var(--color-border-2)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                  textDecoration: 'none',
                }}
              >
                {tag.label}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </div>
  );
}
