'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Schedule, Session, Speaker } from '@/lib/data/schema';
import { search, type SearchHit } from '@/lib/queries/search';
import { SessionCard } from '@/components/server/SessionCard';
import { SpeakerRow } from '@/components/server/SpeakerRow';
import { FavoritesGate } from './FavoritesGate';
import { SearchInput } from './SearchInput';

interface SearchViewProps {
  schedule: Schedule;
  initialQ: string;
}

interface TagCount {
  label: string;
  count: number;
}

function topTags(sessions: Session[], limit: number): TagCount[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const t of s.tags) {
      counts.set(t.label, (counts.get(t.label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function matchingSpeakers(schedule: Schedule, q: string): Speaker[] {
  const needle = q.trim().toLowerCase();
  if (needle.length === 0) return [];
  return schedule.speakers.filter((sp) => sp.name.toLowerCase().includes(needle));
}

export function SearchView({ schedule, initialQ }: SearchViewProps) {
  const [q, setQ] = useState(initialQ);
  const speakersById = useMemo(
    () => new Map<number, Speaker>(schedule.speakers.map((s) => [s.id, s])),
    [schedule.speakers],
  );

  const sessionHits: SearchHit[] = useMemo(
    () => (q.trim().length === 0 ? [] : search(schedule, q)),
    [schedule, q],
  );

  const speakerHits: Speaker[] = useMemo(
    () => matchingSpeakers(schedule, q),
    [schedule, q],
  );

  const tags = useMemo(() => topTags(schedule.sessions, 12), [schedule.sessions]);
  const workshops = useMemo(
    () => schedule.sessions.filter((s) => s.kind === 'workshop'),
    [schedule.sessions],
  );

  const hasQuery = q.trim().length > 0;

  return (
    <>
      <SearchInput defaultValue={initialQ} onQueryChange={setQ} />

      {hasQuery ? (
        <ResultsView
          sessionHits={sessionHits}
          speakerHits={speakerHits}
          speakersById={speakersById}
        />
      ) : (
        <EmptyStateView
          sessions={schedule.sessions}
          speakersById={speakersById}
          workshops={workshops}
          tags={tags}
        />
      )}
    </>
  );
}

interface ResultsViewProps {
  sessionHits: SearchHit[];
  speakerHits: Speaker[];
  speakersById: Map<number, Speaker>;
}

function ResultsView({ sessionHits, speakerHits, speakersById }: ResultsViewProps) {
  const noResults = sessionHits.length === 0 && speakerHits.length === 0;
  if (noResults) {
    return (
      <div
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        No matches. Try a shorter query or a speaker name.
      </div>
    );
  }

  return (
    <>
      {sessionHits.length > 0 ? (
        <Section label={`Sessions · ${sessionHits.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessionHits.map((hit) => {
              const sps = hit.session.speakerIds
                .map((id) => speakersById.get(id))
                .filter((s): s is Speaker => s !== undefined);
              return <SessionCard key={hit.session.id} session={hit.session} speakers={sps} />;
            })}
          </div>
        </Section>
      ) : null}

      {speakerHits.length > 0 ? (
        <Section label={`Speakers · ${speakerHits.length}`}>
          <div
            style={{
              margin: '0 12px',
              borderRadius: 14,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
            }}
          >
            {speakerHits.map((sp) => (
              <SpeakerRow key={sp.id} speaker={sp} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

interface EmptyStateViewProps {
  sessions: Session[];
  speakersById: Map<number, Speaker>;
  workshops: Session[];
  tags: TagCount[];
}

function EmptyStateView({ sessions, speakersById, workshops, tags }: EmptyStateViewProps) {
  return (
    <>
      <Section label="From your saved">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map((s) => {
            const sps = s.speakerIds
              .map((id) => speakersById.get(id))
              .filter((sp): sp is Speaker => sp !== undefined);
            return (
              <FavoritesGate key={s.id} sessionId={s.id}>
                <SessionCard session={s} speakers={sps} />
              </FavoritesGate>
            );
          })}
        </div>
        <div
          style={{
            padding: '0 16px',
            fontSize: 13,
            color: 'var(--color-text-faint)',
            marginTop: 4,
          }}
        >
          Star sessions on the schedule and they show up here.
        </div>
      </Section>

      {workshops.length > 0 ? (
        <Section label="Don't miss these">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workshops.map((s) => {
              const sps = s.speakerIds
                .map((id) => speakersById.get(id))
                .filter((sp): sp is Speaker => sp !== undefined);
              return <SessionCard key={s.id} session={s} speakers={sps} />;
            })}
          </div>
        </Section>
      ) : null}

      {tags.length > 0 ? (
        <Section label="Browse tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px' }}>
            {tags.map((t) => (
              <Link
                key={t.label}
                href={`/search?q=${encodeURIComponent(t.label)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '0.5px solid var(--color-border-2)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span>{t.label}</span>
                <span style={{ color: 'var(--color-text-faint)', fontSize: 11 }}>{t.count}</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '8px 0 16px' }}>
      <div
        style={{
          padding: '0 16px 8px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}
