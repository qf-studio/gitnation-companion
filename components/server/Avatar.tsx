interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
  tint?: string;
}

export default function Avatar({ url, name, size = 22, tint = '#9CA6B3' }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const fontSize = Math.round(size * 0.36);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: `1px solid ${tint}55`,
        }}
      />
    );
  }

  return (
    <span
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        color: tint,
        background: `linear-gradient(135deg, ${tint}33 0%, ${tint}1A 100%)`,
        border: `1px solid ${tint}55`,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
