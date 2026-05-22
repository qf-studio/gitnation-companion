'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface TabSpec {
  href: string;
  label: string;
  icon: ReactNode;
  match: (pathname: string) => boolean;
}

const TABS: TabSpec[] = [
  {
    href: '/',
    label: 'Schedule',
    icon: <CalendarIcon />,
    match: (p) => p === '/' || p.startsWith('/sessions'),
  },
  {
    href: '/search',
    label: 'Search',
    icon: <SearchIcon />,
    match: (p) => p.startsWith('/search'),
  },
  {
    href: '/favorites',
    label: 'Saved',
    icon: <StarIcon />,
    match: (p) => p.startsWith('/favorites'),
  },
  {
    href: '/speakers',
    label: 'Speakers',
    icon: <UsersIcon />,
    match: (p) => p.startsWith('/speakers'),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        padding: '6px 4px env(safe-area-inset-bottom, 22px)',
        background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-around',
      }}
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              maxWidth: 88,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 14px 4px',
              color: active
                ? 'var(--color-brand-on-surface)'
                : 'var(--color-text-muted)',
              fontWeight: active ? 700 : 500,
              fontSize: 10.5,
              textDecoration: 'none',
            }}
          >
            <span aria-hidden="true" style={{ display: 'flex' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function CalendarIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={4} width={18} height={17} rx={2} />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 14.9 9.3 22 10.2 17 15 18.2 22 12 18.6 5.8 22 7 15 2 10.2 9.1 9.3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
