import { getSchedule } from '@/lib/data';
import { listSpeakers } from '@/lib/queries/speakers';
import { ScreenHeader } from '@/components/server/ScreenHeader';
import { SpeakerRow } from '@/components/server/SpeakerRow';
import { AZJumpBar } from '@/components/server/AZJumpBar';
import type { Speaker } from '@/lib/data/schema';

function lastWord(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function firstLetter(name: string): string {
  const ch = lastWord(name).charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

export default function SpeakersIndexPage() {
  const schedule = getSchedule();
  const speakers = listSpeakers(schedule);

  const groups = new Map<string, Speaker[]>();
  for (const sp of speakers) {
    const letter = firstLetter(sp.name);
    const bucket = groups.get(letter);
    if (bucket) bucket.push(sp);
    else groups.set(letter, [sp]);
  }

  const letterKeys = [...groups.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <ScreenHeader
        title="Speakers"
        subtitle={`${speakers.length} speaker${speakers.length === 1 ? '' : 's'}`}
      />

      <AZJumpBar letters={letterKeys} />

      {letterKeys.map((letter) => {
        const bucket = groups.get(letter) ?? [];
        return (
          <section key={letter} style={{ marginBottom: 16 }}>
            <div
              id={`letter-${letter}`}
              style={{
                position: 'sticky',
                top: 'var(--banner-pad)',
                zIndex: 5,
                padding: '8px 16px',
                background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                borderBottom: '0.5px solid var(--color-border)',
              }}
            >
              {letter}
            </div>
            <div
              style={{
                margin: '8px 12px 0',
                borderRadius: 14,
                border: '0.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
              }}
            >
              {bucket.map((sp) => (
                <SpeakerRow key={sp.id} speaker={sp} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
