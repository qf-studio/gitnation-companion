import type { Speaker } from '@/lib/data/schema';

interface SocialIconRowProps {
  speaker: Pick<Speaker, 'github' | 'twitter' | 'bluesky'>;
}

interface Pill {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function buildPills(speaker: SocialIconRowProps['speaker']): Pill[] {
  const pills: Pill[] = [];
  if (speaker.github) {
    pills.push({
      href: `https://github.com/${speaker.github}`,
      label: 'GitHub',
      icon: <GitHubIcon />,
    });
  }
  if (speaker.twitter) {
    pills.push({
      href: `https://x.com/${speaker.twitter}`,
      label: 'X (Twitter)',
      icon: <XIcon />,
    });
  }
  if (speaker.bluesky) {
    pills.push({
      href: `https://bsky.app/profile/${speaker.bluesky}`,
      label: 'Bluesky',
      icon: <BlueskyIcon />,
    });
  }
  return pills;
}

export function SocialIconRow({ speaker }: SocialIconRowProps) {
  const pills = buildPills(speaker);
  if (pills.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {pills.map((pill) => (
        <a
          key={pill.label}
          href={pill.href}
          aria-label={pill.label}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '0.5px solid var(--color-border-2)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          {pill.icon}
        </a>
      ))}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.24 2.75.12 3.04.73.8 1.18 1.82 1.18 3.08 0 4.43-2.7 5.41-5.27 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.14 0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.654l-5.214-6.817-5.97 6.817H1.68l7.73-8.835L1.254 2.25h6.815l4.713 6.231 5.462-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function BlueskyIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.34 4.27C8.91 6.22 11.67 10.18 12 12.3c.33-2.12 3.09-6.08 5.66-8.03 1.85-1.4 4.85-2.49 4.85.96 0 .69-.4 5.78-.63 6.6-.81 2.88-3.74 3.61-6.36 3.16 4.57.78 5.74 3.37 3.22 5.95-4.77 4.91-6.86-1.23-7.39-2.81-.1-.29-.14-.42-.15-.31-.01-.11-.05.03-.15.31-.53 1.58-2.62 7.72-7.39 2.81-2.52-2.58-1.35-5.17 3.22-5.95-2.62.45-5.55-.28-6.36-3.16C.32 11.01-.08 5.92-.08 5.23c0-3.45 3-2.36 4.85-.96Z" />
    </svg>
  );
}
