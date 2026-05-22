export function FavoritesSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        margin: '0 12px',
        padding: '8px 0',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 84,
            borderRadius: 14,
            border: '0.5px solid var(--color-border)',
            background:
              'linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-2) 50%, var(--color-surface) 100%)',
            opacity: 0.45,
          }}
        />
      ))}
    </div>
  );
}
