'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listFavorites, subscribe } from '@/lib/favorites/store';

const tabs = [
  { href: '/', label: 'Schedule', icon: CalendarIcon },
  { href: '/search', label: 'Search', icon: SearchIcon },
  { href: '/favorites', label: 'Saved', icon: StarIcon, badge: true },
  { href: '/speakers', label: 'Speakers', icon: PeopleIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(listFavorites().length);
    return subscribe(() => setCount(listFavorites().length));
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        padding: `6px 4px env(safe-area-inset-bottom, 22px)`,
        background: 'rgba(11,15,20,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const { href, label, icon: Icon } = tab;
        const badge = 'badge' in tab && tab.badge;
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 14px 4px',
              textDecoration: 'none',
              color: active ? 'var(--brand-on-surface)' : 'var(--text-muted)',
              fontWeight: active ? 700 : 500,
              fontSize: 10.5,
              position: 'relative',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon size={22} />
              {badge && count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: 'var(--brand-on-surface)',
                    color: 'var(--bg)',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {count}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function SearchIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PeopleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
