import Link from 'next/link';
import type { ReactNode } from 'react';

interface PushHeaderProps {
  backHref: string;
  /** Right-side accessory (e.g., FavoriteStar). */
  accessory?: ReactNode;
  /** Render with transparent background + no border (used on speaker profile). */
  transparent?: boolean;
}

export function PushHeader({ backHref, accessory, transparent = false }: PushHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 'var(--banner-pad)',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        background: transparent
          ? 'transparent'
          : 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        backdropFilter: transparent ? undefined : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: transparent ? undefined : 'blur(20px) saturate(180%)',
        borderBottom: transparent ? 'none' : '0.5px solid var(--color-border)',
      }}
    >
      <Link
        href={backHref}
        aria-label="Back"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          color: 'var(--color-text)',
          textDecoration: 'none',
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {accessory}
      </div>
    </header>
  );
}
