export default function LiveDot() {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: 'var(--live)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          border: '1px solid var(--live)',
          opacity: 0.4,
          animation: 'live-beacon 1.4s ease-out infinite',
        }}
      />
    </span>
  );
}
