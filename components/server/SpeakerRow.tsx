import Link from 'next/link';
import type { Speaker } from '@/lib/data/schema';
import { Avatar } from './Avatar';

interface SpeakerRowProps {
  speaker: Speaker;
}

export function SpeakerRow({ speaker }: SpeakerRowProps) {
  const tagline = [speaker.company, speaker.location].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/speakers/${speaker.nickname}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        textDecoration: 'none',
        color: 'inherit',
        borderTop: '0.5px solid var(--color-border)',
      }}
    >
      <Avatar url={speaker.avatar} name={speaker.name} size={40} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text)',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {speaker.name}
        </span>
        {tagline ? (
          <span
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tagline}
          </span>
        ) : null}
      </span>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
