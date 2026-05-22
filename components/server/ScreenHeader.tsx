import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
}

export function ScreenHeader({ kicker, title, subtitle }: ScreenHeaderProps) {
  return (
    <header style={{ padding: '8px 16px 12px' }}>
      {kicker ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--color-brand-on-surface)',
            marginBottom: 4,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <h1
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1.2,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            lineHeight: 1.3,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </header>
  );
}
