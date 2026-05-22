import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <div
      style={{
        margin: '48px 16px',
        padding: '32px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: -0.2,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.4,
          color: 'var(--color-text-muted)',
          margin: 0,
          maxWidth: 320,
        }}
      >
        {body}
      </p>
    </div>
  );
}
