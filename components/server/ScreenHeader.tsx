interface ScreenHeaderProps {
  kicker: string;
  title: string;
  subtitle: string;
}

export default function ScreenHeader({ kicker, title, subtitle }: ScreenHeaderProps) {
  return (
    <header style={{ padding: '8px 16px 12px' }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: 'var(--brand-on-surface)',
        }}
      >
        {kicker}
      </p>
      <h1
        style={{
          margin: '2px 0 0',
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-1px',
          lineHeight: 1.2,
          color: 'var(--text)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: '4px 0 0',
          fontSize: 13.5,
          fontWeight: 500,
          lineHeight: 1.3,
          color: 'var(--text-muted)',
        }}
      >
        {subtitle}
      </p>
    </header>
  );
}
