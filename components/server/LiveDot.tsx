interface LiveDotProps {
  size?: number;
}

export function LiveDot({ size = 7 }: LiveDotProps) {
  return (
    <span
      className="live-beacon"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '9999px',
        background: 'var(--color-live)',
        position: 'relative',
        flexShrink: 0,
      }}
      aria-label="Live now"
    />
  );
}
