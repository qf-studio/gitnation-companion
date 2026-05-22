interface Day {
  dayKey: string;
  label: string;
  sublabel: string;
}

interface DaySwitcherProps {
  days: Day[];
  activeDay: string;
}

export default function DaySwitcher({ days, activeDay }: DaySwitcherProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '8px 12px',
        background: 'rgba(11,15,20,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderRadius: 12,
          border: '0.5px solid var(--border)',
          padding: 4,
          gap: 2,
        }}
      >
        {days.map((day, i) => {
          const isActive = day.dayKey === activeDay;
          return (
            <a
              key={day.dayKey}
              href={`#day-${i + 1}`}
              style={{
                borderRadius: 10,
                padding: '8px 12px',
                background: isActive ? 'var(--brand-soft)' : 'transparent',
                color: isActive ? 'var(--brand-on-surface)' : 'var(--text-muted)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{day.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {day.sublabel}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
