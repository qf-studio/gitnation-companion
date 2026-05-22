import type { Session } from '@/lib/data/schema';

interface KindChipProps {
  kind: Session['kind'];
}

const LABELS: Record<Session['kind'], string> = {
  talk: 'Talk',
  workshop: 'Workshop',
};

export function KindChip({ kind }: KindChipProps) {
  const style: React.CSSProperties = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: 4,
    color: 'var(--color-text-muted)',
    background: 'transparent',
    border: '1px solid var(--color-border-2)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  return <span style={style}>{LABELS[kind]}</span>;
}
