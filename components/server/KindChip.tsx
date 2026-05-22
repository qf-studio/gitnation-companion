import type { Session } from '@/lib/data/schema';

type Kind = Session['kind'];

const solidKinds = new Set(['keynote', 'lightning']);

export default function KindChip({ kind }: { kind: Kind }) {
  // Schema only has 'talk' | 'workshop', but guard for future 'break' / 'keynote' / 'lightning'
  if (!['talk', 'workshop', 'keynote', 'lightning'].includes(kind)) return null;

  const isSolid = solidKinds.has(kind);
  const label = kind === 'workshop' ? 'Workshop' : 'Talk';

  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderRadius: 4,
        padding: '2px 6px',
        background: isSolid ? 'var(--text)' : 'transparent',
        color: isSolid ? 'var(--bg)' : 'var(--text-muted)',
        border: isSolid ? 'none' : '1px solid var(--border-2)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
