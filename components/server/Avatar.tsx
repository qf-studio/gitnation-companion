interface AvatarProps {
  url: string | null;
  name: string;
  size?: 22 | 40 | 88;
}

function hashTint(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 60% 55%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ url, name, size = 22 }: AvatarProps) {
  const tint = hashTint(name);
  const fontSize = Math.round(size * 0.36);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '9999px',
    background: `linear-gradient(135deg, ${tint} 0%, color-mix(in srgb, ${tint} 30%, transparent) 100%)`,
    border: `1px solid color-mix(in srgb, ${tint} 60%, transparent)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 600,
    fontSize,
    overflow: 'hidden',
    flexShrink: 0,
  };

  if (!url) {
    return (
      <span style={containerStyle} aria-label={name}>
        {initials(name)}
      </span>
    );
  }

  return (
    <span style={containerStyle} aria-label={name}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs are pre-optimized */}
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </span>
  );
}
