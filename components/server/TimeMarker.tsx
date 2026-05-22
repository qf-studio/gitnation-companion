import LiveDot from './LiveDot';

interface TimeMarkerProps {
  time: string;
  isLive?: boolean;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export default function TimeMarker({ time, isLive = false }: TimeMarkerProps) {
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
          color: isLive ? 'var(--live)' : 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        {formatTime(time)}
      </span>
      <div
        style={{
          flex: 1,
          height: '0.5px',
          background: isLive ? 'var(--live)' : 'var(--border)',
        }}
      />
      {isLive && <LiveDot />}
    </div>
  );
}
