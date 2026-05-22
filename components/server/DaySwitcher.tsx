import { formatDayKeyDisplay } from '@/lib/format/datetime';

interface DaySwitcherProps {
  dayKeys: string[];
  activeDayKey: string;
}

export function DaySwitcher({ dayKeys, activeDayKey }: DaySwitcherProps) {
  if (dayKeys.length < 2) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 'var(--banner-pad)',
        zIndex: 20,
        padding: '8px 12px',
        background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '0.5px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          border: '0.5px solid var(--color-border)',
          borderRadius: 12,
          background: 'var(--color-surface)',
        }}
      >
        {dayKeys.map((dayKey, i) => {
          const active = dayKey === activeDayKey;
          return (
            <a
              key={dayKey}
              href={`#day-${i + 1}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 12px',
                borderRadius: 10,
                background: active ? 'var(--color-brand-soft)' : 'transparent',
                color: active
                  ? 'var(--color-brand-on-surface)'
                  : 'var(--color-text-muted)',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>
                Day {i + 1}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {formatDayKeyDisplay(dayKey)}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
