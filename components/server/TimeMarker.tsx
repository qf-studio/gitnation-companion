import { LiveDot } from './LiveDot';
import { formatTime } from '@/lib/format/datetime';

interface TimeMarkerProps {
  startsAt: string;
  isLive?: boolean;
}

export function TimeMarker({ startsAt, isLive = false }: TimeMarkerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px 2px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--color-text-muted)',
        }}
      >
        {formatTime(startsAt)}
      </span>
      <span
        style={{
          flex: 1,
          height: 0,
          borderTop: `0.5px solid ${isLive ? 'var(--color-live)' : 'var(--color-border)'}`,
        }}
      />
      {isLive ? <LiveDot /> : null}
    </div>
  );
}
