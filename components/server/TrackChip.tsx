interface TrackChipProps {
  label: string;
  color: string;
}

export default function TrackChip({ label, color }: TrackChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        padding: '3px 8px 3px 7px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: `${color}1F`,
        border: `0.5px solid ${color}66`,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 2px ${color}33`,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
