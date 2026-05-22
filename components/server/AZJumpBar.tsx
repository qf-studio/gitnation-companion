interface AZJumpBarProps {
  letters: string[];
}

export function AZJumpBar({ letters }: AZJumpBarProps) {
  if (letters.length === 0) return null;

  return (
    <nav
      aria-label="Jump to letter"
      style={{
        position: 'fixed',
        right: 2,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        padding: '4px 4px',
        borderRadius: 999,
      }}
    >
      {letters.map((letter) => (
        <a
          key={letter}
          href={`#letter-${letter}`}
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            padding: '1px 4px',
            lineHeight: 1.2,
          }}
        >
          {letter}
        </a>
      ))}
    </nav>
  );
}
